using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBuildingTypeAndRenovationLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BuildingType",
                table: "Properties",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RenovationLevel",
                table: "Properties",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BuildingType",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "RenovationLevel",
                table: "Properties");
        }
    }
}
