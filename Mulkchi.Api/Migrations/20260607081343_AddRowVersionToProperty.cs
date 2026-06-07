using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRowVersionToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Properties",
                type: "bytea",
                rowVersion: true,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Properties");
        }
    }
}
