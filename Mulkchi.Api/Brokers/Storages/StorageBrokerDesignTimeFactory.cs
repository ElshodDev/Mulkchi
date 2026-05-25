using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

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

        return new StorageBroker(optionsBuilder.Options);
    }
}
