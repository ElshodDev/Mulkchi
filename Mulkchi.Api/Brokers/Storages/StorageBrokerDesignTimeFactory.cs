using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Mulkchi.Api.Brokers.Storages;

public class StorageBrokerDesignTimeFactory : IDesignTimeDbContextFactory<StorageBroker>
{
    public StorageBroker CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<StorageBroker>();
        
        // Use configuration for design time - reads from appsettings.json
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        
        // Fallback if connection string is null or empty
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            connectionString = "Data Source=DESKTOP-BBV4DEP;Initial Catalog=MulkchiDb;Integrated Security=True;TrustServerCertificate=true;MultipleActiveResultSets=true";
        }
        
        optionsBuilder.UseSqlServer(connectionString, options => options.EnableRetryOnFailure());

        // Create mock environment
        var mockEnvironment = new MockWebHostEnvironment();

        return new StorageBroker(optionsBuilder.Options, configuration, mockEnvironment);
    }

    private class MockWebHostEnvironment : IWebHostEnvironment
    {
        private string _environmentName = "DesignTime";
        
        public string EnvironmentName 
        { 
            get => _environmentName; 
            set => _environmentName = value; 
        }
        
        public string ApplicationName { get; set; } = "Mulkchi.Api";
        public string WebRootPath { get; set; } = "";
        public Microsoft.Extensions.FileProviders.IFileProvider WebRootFileProvider { get; set; } = null!;
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } = null!;
    }
}
