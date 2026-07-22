using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartHomeAutomation.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAutomationRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Condition",
                table: "AutomationRules",
                newName: "TriggerValue");

            migrationBuilder.AddColumn<string>(
                name: "TriggerType",
                table: "AutomationRules",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TriggerType",
                table: "AutomationRules");

            migrationBuilder.RenameColumn(
                name: "TriggerValue",
                table: "AutomationRules",
                newName: "Condition");
        }
    }
}
