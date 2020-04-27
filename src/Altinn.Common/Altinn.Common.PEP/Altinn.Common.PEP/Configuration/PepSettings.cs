namespace Altinn.Common.PEP.Configuration
{
    /// <summary>
    /// General configuration settings
    /// </summary>
    public class PepSettings
    {
        /// <summary>
        /// Gets or sets to disable pep er not
        /// </summary>
        public bool DisablePEP { get; set; }


        /// <summary>
        /// The timout on pdp decions
        /// </summary>
        public int PdpDecisionCachingTimeout { get; set; }
    }
}
