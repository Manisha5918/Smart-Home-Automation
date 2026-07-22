using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class AddDeviceStatusToActivityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeviceStatus",
                table: "ActivityLogs",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeviceStatus",
                table: "ActivityLogs");
        }
    }
}
