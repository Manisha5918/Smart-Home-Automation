using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomDeviceRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.RenameColumn(
                name: "EnergyConsumed",
                table: "EnergyUsages",
                newName: "PowerConsumption");

            migrationBuilder.RenameIndex(
                name: "IX_DeviceImage_DeviceId",
                table: "DeviceImages",
                newName: "IX_DeviceImages_DeviceId");

            migrationBuilder.AddColumn<int>(
                name: "RoomId",
                table: "Devices",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DeviceImages",
                table: "DeviceImages",
                column: "ImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Devices_RoomId",
                table: "Devices",
                column: "RoomId");

            migrationBuilder.AddForeignKey(
                name: "FK_DeviceImages_Devices_DeviceId",
                table: "DeviceImages",
                column: "DeviceId",
                principalTable: "Devices",
                principalColumn: "DeviceId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Devices_Rooms_RoomId",
                table: "Devices",
                column: "RoomId",
                principalTable: "Rooms",
                principalColumn: "RoomId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeviceImages_Devices_DeviceId",
                table: "DeviceImages");

            migrationBuilder.DropForeignKey(
                name: "FK_Devices_Rooms_RoomId",
                table: "Devices");

            migrationBuilder.DropIndex(
                name: "IX_Devices_RoomId",
                table: "Devices");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DeviceImages",
                table: "DeviceImages");

            migrationBuilder.DropColumn(
                name: "RoomId",
                table: "Devices");

            migrationBuilder.RenameTable(
                name: "DeviceImages",
                newName: "DeviceImage");

            migrationBuilder.RenameColumn(
                name: "PowerConsumption",
                table: "EnergyUsages",
                newName: "EnergyConsumed");

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
    }
}
