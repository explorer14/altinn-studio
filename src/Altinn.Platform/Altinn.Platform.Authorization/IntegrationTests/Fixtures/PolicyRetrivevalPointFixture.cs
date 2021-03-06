using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using Altinn.Authorization.ABAC.Interface;
using Altinn.Platform.Authorization.Repositories.Interface;
using Altinn.Platform.Authorization.Services.Implementation;
using Altinn.Platform.Authorization.Services.Interface;
using Altinn.Platform.Storage.UnitTest.Mocks.Authentication;
using AltinnCore.Authentication.JwtCookie;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Altinn.Platform.Authorization.IntegrationTests.Fixtures
{
    public class PolicyRetrivevalPointFixture : IDisposable
    {
        private readonly TestServer testServer;

        /// <summary>
        /// Gets the client.
        /// </summary>
        public HttpClient Client { get; }

        public PolicyRetrivevalPointFixture()
        {
            string[] args = { };

            Program.ConfigureSetupLogging();
            ConfigurationBuilder config = new ConfigurationBuilder();
            Program.LoadConfigurationSettings(config, GetContentRootPath(), args);

            IWebHostBuilder builder = new WebHostBuilder()
                .ConfigureTestServices(services =>
                {
                    services.AddScoped<IContextHandler, MockServices.ContextHandler>();
                    services.AddScoped<IPolicyRetrievalPoint, PolicyRetrievalPoint>();
                    services.AddScoped<IRoles, MockServices.PolicyInformationPoint>();
                    services.AddScoped<IContextHandler, MockServices.ContextHandler>();
                    services.AddScoped<IPolicyRepository, MockServices.PolicyRepository>();
                    services.AddSingleton<IPostConfigureOptions<JwtCookieOptions>, JwtCookiePostConfigureOptionsStub>();
                })
                .ConfigureAppConfiguration((hostingContext, config) =>
                {
                    Program.LoadConfigurationSettings(config, GetContentRootPath(), args);
                })
                .UseContentRoot(GetContentRootPath())
                .UseEnvironment("Development")
                .UseConfiguration(config.Build())
                .UseStartup<Altinn.Platform.Authorization.Startup>();

            testServer = new TestServer(builder);
            Client = testServer.CreateClient();
        }

        private string GetContentRootPath()
        {
            var testProjectPath = AppContext.BaseDirectory;
            var relativePathToHostProject = @"..\..\..\..\";

            return Path.Combine(testProjectPath, relativePathToHostProject);
        }

        /// <summary>
        /// creates a new http client.
        /// </summary>
        /// <returns></returns>
        public HttpClient GetClient()
        {
            return Client;
        }

        /// <summary>
        /// Clean up.
        /// </summary>
        public void Dispose()
        {
            Client.Dispose();
            testServer.Dispose();
        }
    }
}
