using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class FixDeviceImageTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeviceImages_Devices_DeviceId",
                table: "DeviceImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeviceImages",
                table: "DeviceImages");

            migrationBuilder.RenameTable(
                name: "DeviceImages",
                newName: "DeviceImage");

            migrationBuilder.RenameIndex(
                name: "IX_DeviceImages_DeviceId",
                table: "DeviceImage",
                newName: "IX_DeviceImage_DeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeviceImage",
                table: "DeviceImage",
                column: "ImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceImage_Devices_DeviceId",
                table: "DeviceImage",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeviceImage_Devices_DeviceId",
                table: "DeviceImage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeviceImage",
                table: "DeviceImage");

            migrationBuilder.RenameTable(
                name: "DeviceImage",
                newName: "DeviceImages");

            migrationBuilder.RenameIndex(
                name: "IX_DeviceImage_DeviceId",
                table: "DeviceImages",
                newName: "IX_DeviceImages_DeviceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeviceImages",
                table: "DeviceImages",
                column: "ImageId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceImages_Devices_DeviceId",
                table: "DeviceImages",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
