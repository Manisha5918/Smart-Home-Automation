using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class AddVacationMode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VacationModes",
                columns: table => new
                {
                    VacationModeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SecurityModeEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    EstimatedEnergySaved = table.Column<double>(type: "double", nullable: false),
                    EstimatedMoneySaved = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    EstimatedCO2Saved = table.Column<double>(type: "double", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VacationModes", x => x.VacationModeId);
                    table.ForeignKey(
                        name: "FK_VacationModes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "VacationDeviceStates",
                columns: table => new
                {
                    VacationDeviceStateId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    VacationModeId = table.Column<int>(type: "int", nullable: false),
                    DeviceId = table.Column<int>(type: "int", nullable: false),
                    PreviousStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VacationDeviceStates", x => x.VacationDeviceStateId);
                    table.ForeignKey(
                        name: "FK_VacationDeviceStates_Devices_DeviceId",
                        column: x => x.DeviceId,
                        principalTable: "Devices",
                        principalColumn: "DeviceId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VacationDeviceStates_VacationModes_VacationModeId",
                        column: x => x.VacationModeId,
                        principalTable: "VacationModes",
                        principalColumn: "VacationModeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_VacationDeviceStates_DeviceId",
                table: "VacationDeviceStates",
                column: "DeviceId");

            migrationBuilder.CreateIndex(
                name: "IX_VacationDeviceStates_VacationModeId",
                table: "VacationDeviceStates",
                column: "VacationModeId");

            migrationBuilder.CreateIndex(
                name: "IX_VacationModes_UserId",
                table: "VacationModes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VacationDeviceStates");

            migrationBuilder.DropTable(
                name: "VacationModes");
        }
    }
}
