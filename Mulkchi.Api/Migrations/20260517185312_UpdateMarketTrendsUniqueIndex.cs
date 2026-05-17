using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMarketTrendsUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_Region_District_YearMonth",
                table: "MarketTrends");

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_Region_District_PropertyType_YearMonth",
                table: "MarketTrends",
                columns: new[] { "Region", "District", "PropertyType", "YearMonth" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_Region_District_PropertyType_YearMonth",
                table: "MarketTrends");

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_Region_District_YearMonth",
                table: "MarketTrends",
                columns: new[] { "Region", "District", "YearMonth" },
                unique: true);
        }
    }
}
