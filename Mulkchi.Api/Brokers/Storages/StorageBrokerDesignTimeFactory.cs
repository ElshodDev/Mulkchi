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
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = Environment.GetEnvironmentVariable("MULKCHI_CONNECTION_STRING")
            ?? config.GetConnectionString("DefaultConnection");
        
        optionsBuilder.UseNpgsql(connectionString, options => options.EnableRetryOnFailure());

        // Create mock environment
        var mockEnvironment = new MockWebHostEnvironment();

        return new StorageBroker(optionsBuilder.Options, config, mockEnvironment);
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
