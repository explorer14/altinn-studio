using System;
using System.Linq;
using System.Threading.Tasks;
using Altinn.Authorization.ABAC.Xacml;
using Altinn.Authorization.ABAC.Xacml.JsonProfile;
using Altinn.Common.PEP.Authorization;
using Altinn.Common.PEP.Configuration;
using Altinn.Common.PEP.Constants;
using Altinn.Common.PEP.Helpers;
using Altinn.Common.PEP.Interfaces;
using Altinn.Platform.Storage.Helpers;
using Altinn.Platform.Storage.Interface.Models;
using Altinn.Platform.Storage.Repository;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace Altinn.Platform.Storage.Authorization
{
    /// <summary>
    /// AuthorizationHandler that is created for handling access to app.
    /// Authorizes based om AppAccessRequirement and app id from route
    /// <see href="https://docs.asp.net/en/latest/security/authorization/policies.html"/> for details about authorization
    /// in asp.net core
    /// </summary>
    public class StorageAccessHandler : AuthorizationHandler<AppAccessRequirement>
    {
        private readonly IInstanceRepository _instanceRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IPDP _pdp;
        private readonly PepSettings _pepSettings;
        private readonly ILogger _logger;
        private readonly IMemoryCache _memoryCache;

        /// <summary>
        /// Initializes a new instance of the <see cref="StorageAccessHandler"/> class.
        /// </summary>
        /// <param name="httpContextAccessor">The http context accessor</param>
        /// <param name="pdp">The pdp</param>
        /// <param name="pepSettings">The settings for pep</param>
        /// <param name="logger">The logger. </param
        /// <param name="instanceRepository">The instance repository</param>
        public StorageAccessHandler(
            IHttpContextAccessor httpContextAccessor,
            IPDP pdp,
            IOptions<PepSettings> pepSettings,
            ILogger<StorageAccessHandler> logger,
            IInstanceRepository instanceRepository,
            IMemoryCache memoryCache)
        {
            _httpContextAccessor = httpContextAccessor;
            _pdp = pdp;
            _pepSettings = pepSettings.Value;
            _logger = logger;
            _instanceRepository = instanceRepository;
            _memoryCache = memoryCache;
        }

        /// <summary>
        /// This method authorize access bases on context and requirement
        /// Is triggered by annotation on MVC action and setup in startup.
        /// </summary>
        /// <param name="context">The context</param>
        /// <param name="requirement">The requirement</param>
        /// <returns>A Task</returns>
        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AppAccessRequirement requirement)
        {
            if (_pepSettings.DisablePEP)
            {
                context.Succeed(requirement);
                return;
            }

            XacmlJsonRequestRoot request = DecisionHelper.CreateDecisionRequest(context, requirement, _httpContextAccessor.HttpContext.GetRouteData());

            _logger.LogInformation($"// Altinn PEP // AppAccessHandler // Request sent: {JsonConvert.SerializeObject(request)}");

            XacmlJsonResponse response;

            // Get The instance to enrich the request
            Instance instance = await GetInstance(request);
            if (instance != null)
            {
                AuthorizationHelper.EnrichXacmJsonRequest(request, instance);
                response = await GetDecisionForRequest(request);
            }
            else
            {
                response = await _pdp.GetDecisionForRequest(request);
            }

            if (response?.Response == null)
            {
                throw new ArgumentNullException("response");
            }

            if (!DecisionHelper.ValidatePdpDecision(response.Response, context.User))
            {
                context.Fail();
            }

            context.Succeed(requirement);
            await Task.CompletedTask;
        }

        private async Task<XacmlJsonResponse> GetDecisionForRequest(XacmlJsonRequestRoot request)
        {
            string cacheKey = GetCacheKeyForDecisionRequest(request);

            if (!_memoryCache.TryGetValue(cacheKey, out XacmlJsonResponse response))
            {
                // Key not in cache, so get data.
                response = await _pdp.GetDecisionForRequest(request);

                var cacheEntryOptions = new MemoryCacheEntryOptions()
               .SetPriority(CacheItemPriority.High)
               .SetAbsoluteExpiration(new TimeSpan(0, 5, 0));

                _memoryCache.Set(cacheKey, response, cacheEntryOptions);
            }

            return response;
        }

        /// <summary>
        /// Get the instance from database based on request
        /// </summary>
        /// <param name="request">The request</param>
        /// <returns></returns>
        private async Task<Instance> GetInstance(XacmlJsonRequestRoot request)
        {
            string instanceId = string.Empty;
            foreach (XacmlJsonCategory category in request.Request.Resource)
            {
                foreach (var atr in category.Attribute)
                {
                    if (atr.AttributeId.Equals(AltinnXacmlUrns.InstanceId))
                    {
                        instanceId = atr.Value;
                        break;
                    }
                }
            }

            if (string.IsNullOrEmpty(instanceId))
            {
                return null;
            }

            Instance instance = await _instanceRepository.GetOne(instanceId, Convert.ToInt32(instanceId.Split("/")[0]));
            return instance;
        }

        private string GetCacheKeyForDecisionRequest(XacmlJsonRequestRoot request)
        {
            string resourceKey = string.Empty;
            foreach (XacmlJsonCategory category in request.Request.Resource)
            {
                foreach (XacmlJsonAttribute atr in category.Attribute)
                {
                    resourceKey += atr.AttributeId + ":" + atr.Value + ";";
                }
            }

            string subjectKey = string.Empty;
            foreach (XacmlJsonCategory category in request.Request.AccessSubject)
            {
                foreach (XacmlJsonAttribute atr in category.Attribute)
                {
                    subjectKey += atr.AttributeId + ":" + atr.Value + ";";
                }
            }

            string actionKey = string.Empty;
            foreach (XacmlJsonCategory category in request.Request.Action)
            {
                foreach (XacmlJsonAttribute atr in category.Attribute)
                {
                    actionKey += atr.AttributeId + ":" + atr.Value + ";";
                }
            }

            return subjectKey + actionKey + resourceKey;
        }
    }
}