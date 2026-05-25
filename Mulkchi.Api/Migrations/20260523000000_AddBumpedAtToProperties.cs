using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Mulkchi.Api.Brokers.Storages;

#nullable disable

namespace Mulkchi.Api.Migrations
{
    [DbContext(typeof(StorageBroker))]
    [Migration("20260523000000_AddBumpedAtToProperties")]
    public partial class AddBumpedAtToProperties : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "BumpedAt",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BumpedAt",
                table: "Properties");
        }
    }
}
