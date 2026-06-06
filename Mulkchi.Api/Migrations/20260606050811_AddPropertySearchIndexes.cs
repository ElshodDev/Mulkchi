using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertySearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Properties_City",
                table: "Properties",
                column: "City");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_MonthlyRent",
                table: "Properties",
                column: "MonthlyRent");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_SalePrice",
                table: "Properties",
                column: "SalePrice");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Properties_City",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_MonthlyRent",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_SalePrice",
                table: "Properties");
        }
    }
}
