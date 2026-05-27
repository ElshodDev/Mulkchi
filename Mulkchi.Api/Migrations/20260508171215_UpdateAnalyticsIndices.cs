using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAnalyticsIndices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PriceHistories_PropertyId_RecordedDate",
                table: "PriceHistories");

            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_YearMonth",
                table: "MarketTrends");

            migrationBuilder.CreateIndex(
                name: "IX_PriceHistories_PropertyId",
                table: "PriceHistories",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_CalculatedAt",
                table: "MarketTrends",
                column: "CalculatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_PriceHistories_PropertyId",
                table: "PriceHistories");

            migrationBuilder.DropIndex(
                name: "IX_MarketTrends_CalculatedAt",
                table: "MarketTrends");

            migrationBuilder.CreateIndex(
                name: "IX_PriceHistories_PropertyId_RecordedDate",
                table: "PriceHistories",
                columns: new[] { "PropertyId", "RecordedDate" });

            migrationBuilder.CreateIndex(
                name: "IX_MarketTrends_YearMonth",
                table: "MarketTrends",
                column: "YearMonth");
        }
    }
}
