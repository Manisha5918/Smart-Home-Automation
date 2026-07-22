@echo off
echo Setting up Smart Home Automation backend secrets...
echo.

dotnet user-secrets init
dotnet user-secrets set "Jwt:Key" "ThisIsMyVerySecureSecretKeyForSmartHomeAutomation2026"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "server=localhost;port=3306;database=SmartHomeAutomationDB;user=root;password=root;"

echo.
echo Secrets configured. Run the project with: dotnet run
echo To use environment variables instead:
echo   set Jwt:Key=your-secret-key
echo   set ConnectionStrings:DefaultConnection=your-connection-string
