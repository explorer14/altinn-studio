using System.Collections.Generic;
using System.Threading.Tasks;
using Altinn.Platform.Authorization.Clients;
using Altinn.Platform.Authorization.Services.Interface;
using Authorization.Interface.Models;
 using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace Altinn.Platform.Authorization.Services.Implementation
{
    /// <summary>
    /// Wrapper for the parties api
    /// </summary>
    public class PartiesWrapper : IParties
    {
        private readonly PartyClient _partyClient;
        private readonly ILogger _logger;

        /// <summary>
        /// Initializes a new instance of the <see cref="PartiesWrapper"/> class
        /// </summary>
        /// <param name="partyClient">the client handler for actor api</param>
        public PartiesWrapper(PartyClient partyClient, ILogger<PartiesWrapper> logger)
        {
            _partyClient = partyClient;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<List<Party>> GetParties(int userId)
        {            
            List<Party> partiesList = null;

            var request = $"parties?userid={userId}";            
            var response = await _partyClient.Client.GetAsync(request);            
            string partiesDataList = await response.Content.ReadAsStringAsync();
            if (response.StatusCode == System.Net.HttpStatusCode.OK)
            {
                partiesList = JsonConvert.DeserializeObject<List<Party>>(partiesDataList);
            }

            return partiesList;
        }
    }
}