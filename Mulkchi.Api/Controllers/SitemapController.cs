using System.Text;
using System.Xml;
using Microsoft.AspNetCore.Mvc;
using Mulkchi.Api.Brokers.Storages;
using Mulkchi.Api.Models.Foundations.Properties;

namespace Mulkchi.Api.Controllers;

[ApiController]
[Route("sitemap.xml")]
public class SitemapController : ControllerBase
{
    private readonly IStorageBroker storageBroker;

    public SitemapController(IStorageBroker storageBroker)
    {
        this.storageBroker = storageBroker;
    }

    [HttpGet]
    [Produces("application/xml")]
    public IActionResult GetSitemap()
    {
        var properties = this.storageBroker.SelectAllProperties()
            .Where(p => p.Status == PropertyStatus.Active)
            .ToList();

        var baseUrl = "https://mulkchi.uz";
        var stringBuilder = new StringBuilder();

        using (var xmlWriter = XmlWriter.Create(stringBuilder, new XmlWriterSettings { Indent = true }))
        {
            xmlWriter.WriteStartDocument();
            xmlWriter.WriteStartElement("urlset", "http://www.sitemaps.org/schemas/sitemap/0.9");

            // Add Homepage
            xmlWriter.WriteStartElement("url");
            xmlWriter.WriteElementString("loc", $"{baseUrl}/");
            xmlWriter.WriteElementString("changefreq", "daily");
            xmlWriter.WriteElementString("priority", "1.0");
            xmlWriter.WriteEndElement();

            // Add Search page
            xmlWriter.WriteStartElement("url");
            xmlWriter.WriteElementString("loc", $"{baseUrl}/search");
            xmlWriter.WriteElementString("changefreq", "hourly");
            xmlWriter.WriteElementString("priority", "0.9");
            xmlWriter.WriteEndElement();

            // Add dynamic properties
            foreach (var property in properties)
            {
                xmlWriter.WriteStartElement("url");
                xmlWriter.WriteElementString("loc", $"{baseUrl}/properties/{property.Id}");
                xmlWriter.WriteElementString("lastmod", property.UpdatedDate.ToString("yyyy-MM-dd"));
                xmlWriter.WriteElementString("changefreq", "weekly");
                xmlWriter.WriteElementString("priority", "0.8");
                xmlWriter.WriteEndElement();
            }

            xmlWriter.WriteEndElement(); // urlset
            xmlWriter.WriteEndDocument();
        }

        return Content(stringBuilder.ToString(), "application/xml", Encoding.UTF8);
    }
}
