using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceTracker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Title",
                table: "MaintenanceSchedules",
                newName: "ServiceType");

            migrationBuilder.RenameColumn(
                name: "ScheduledDate",
                table: "MaintenanceSchedules",
                newName: "NextServiceDate");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "MaintenanceSchedules",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "MaintenanceSchedules",
                newName: "LastServiceDate");

            migrationBuilder.AddColumn<DateTime>(
                name: "WarrantyExpiryDate",
                table: "MaintenanceSchedules",
                type: "datetime(6)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WarrantyExpiryDate",
                table: "MaintenanceSchedules");

            migrationBuilder.RenameColumn(
                name: "ServiceType",
                table: "MaintenanceSchedules",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "MaintenanceSchedules",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "NextServiceDate",
                table: "MaintenanceSchedules",
                newName: "ScheduledDate");

            migrationBuilder.RenameColumn(
                name: "LastServiceDate",
                table: "MaintenanceSchedules",
                newName: "CreatedAt");
        }
    }
}
