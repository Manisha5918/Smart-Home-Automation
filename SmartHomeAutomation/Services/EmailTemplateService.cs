using System.Text;

namespace SmartHomeAutomation.Services
{
    public class EmailTemplateService
    {
        private readonly IConfiguration _configuration;

        public EmailTemplateService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string BuildBaseLayout(string title, string bodyContent)
        {
            var supportEmail = _configuration["Smtp:SupportEmail"] ?? "support@smarthomeautomation.com";
            var supportPhone = _configuration["Smtp:SupportPhone"] ?? "";
            var year = DateTime.Now.Year;

            return $$"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F0FDF4; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; }
    .card { background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #15803D 0%, #16A34A 100%); padding: 32px 36px; text-align: center; }
    .header h1 { color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; font-weight: 400; }
    .body-content { padding: 36px; }
    .footer { background: #F8FAF9; padding: 24px 36px; text-align: center; border-top: 1px solid #E5E7EB; }
    .footer p { color: #6B7280; font-size: 11px; line-height: 1.6; margin-bottom: 2px; }
    .footer a { color: #15803D; text-decoration: none; font-weight: 600; }
    @media (max-width: 480px) { .header { padding: 24px 20px; } .body-content { padding: 24px 20px; } .footer { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Smart Home Automation</h1>
        <p>Your intelligent home management platform</p>
      </div>
      <div class="body-content">
        {{bodyContent}}
      </div>
      <div class="footer">
        <p style="font-weight:600;color:#374151;font-size:12px">Smart Home Automation</p>
        <p>Need help? <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>{{(supportPhone.Length > 0 ? " or call " + supportPhone : "")}}</p>
        <p style="margin-top:8px">&copy; {{year}} Smart Home Automation. All rights reserved.</p>
        <p style="margin-top:2px">This is an automated message. Please do not reply directly.</p>
      </div>
    </div>
  </div>
</body>
</html>
""";
        }

        public string PrimaryButton(string text, string url)
        {
            return $"""
<table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto">
  <tr>
    <td align="center" style="background:#15803D;border-radius:10px;padding:0">
      <a href="{url}" style="display:inline-block;padding:14px 32px;font-family:'Inter',sans-serif;font-size:14px;font-weight:700;color:#FFFFFF;background:#15803D;border-radius:10px;text-decoration:none;letter-spacing:0.3px">{text}</a>
    </td>
  </tr>
</table>
""";
        }

        public string SecondaryButton(string text, string url)
        {
            return $"""
<table cellpadding="0" cellspacing="0" border="0" style="margin:12px auto">
  <tr>
    <td align="center" style="border:2px solid #15803D;border-radius:10px;padding:0">
      <a href="{url}" style="display:inline-block;padding:10px 28px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;color:#15803D;border-radius:8px;text-decoration:none">{text}</a>
    </td>
  </tr>
</table>
""";
        }

        public string AlertBox(string message, string type = "warning")
        {
            var colors = type == "warning"
                ? new { bg = "#FFFBEB", border = "#FDE68A", text = "#92400E", icon = "\u26A0\uFE0F" }
                : new { bg = "#FEF2F2", border = "#FECACA", text = "#991B1B", icon = "\u274C" };
            return $"""
<div style="background:{colors.bg};border:1px solid {colors.border};border-radius:10px;padding:14px 16px;margin:16px 0">
  <p style="font-size:13px;color:{colors.text};line-height:1.5">{colors.icon} {message}</p>
</div>
""";
        }

        public string InfoCard(string title, string content)
        {
            return $"""
<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px;margin:16px 0">
  <p style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:4px">{title}</p>
  <p style="font-size:13px;color:#374151;line-height:1.5">{content}</p>
</div>
""";
        }

        public string OtpCard(string otp)
        {
            return $"""
<div style="background:linear-gradient(135deg,#F0FDF4 0%,#DCFCE7 100%);border:2px solid #86EFAC;border-radius:14px;padding:24px;margin:20px 0;text-align:center">
  <p style="font-size:11px;font-weight:700;color:#15803D;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:8px">Your Verification Code</p>
  <p style="font-size:36px;font-weight:800;color:#15803D;letter-spacing:8px;font-family:'Inter',monospace;margin:8px 0">{otp}</p>
  <p style="font-size:11px;color:#6B7280;margin-top:8px">This code expires in 10 minutes</p>
</div>
""";
        }

        public string SecurityNotice(string message)
        {
            return $"""
<div style="background:#FEFCE8;border:1px solid #FDE047;border-radius:10px;padding:14px 16px;margin:16px 0">
  <p style="font-size:12px;font-weight:700;color:#854D0E;margin-bottom:4px">Security Notice</p>
  <p style="font-size:12px;color:#713F12;line-height:1.5">{message}</p>
</div>
""";
        }

        public string WarningBanner(string message)
        {
            return $"""
<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:14px 16px;margin:16px 0;text-align:center">
  <p style="font-size:13px;font-weight:700;color:#991B1B;margin-bottom:2px">Warning</p>
  <p style="font-size:12px;color:#7F1D1D;line-height:1.4">{message}</p>
</div>
""";
        }

        public string Divider()
        {
            return """<hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0" />""";
        }

        public string TextBlock(string text)
        {
            return $"""<p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:12px">{text}</p>""";
        }

        public string SmallText(string text)
        {
            return $"""<p style="font-size:12px;color:#9CA3AF;line-height:1.5;margin-bottom:8px">{text}</p>""";
        }

        public string BuildVerifyEmail(string userName, string verificationLink, string otp)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Welcome to Smart Home Automation!"));
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Thank you for creating your account. Please verify your email address by clicking the button below."));
            body.Append(PrimaryButton("Verify Email", verificationLink));
            body.Append(TextBlock("Or enter this verification code:"));
            body.Append(OtpCard(otp));
            body.Append(Divider());
            body.Append(TextBlock("If the button doesn't work, copy and paste this link into your browser:"));
            body.Append(SmallText(verificationLink));
            body.Append(Divider());
            body.Append(SmallText("This verification link and code will expire in 30 minutes."));
            body.Append(SmallText("If you did not create an account, please ignore this email."));
            return BuildBaseLayout("Verify Your Email", body.ToString());
        }

        public string BuildPasswordResetEmail(string userName, string resetLink)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("We received a request to reset your Smart Home Automation account password. Click the button below to choose a new password:"));
            body.Append(PrimaryButton("Reset Password", resetLink));
            body.Append(Divider());
            body.Append(SmallText("This reset link will expire in 10 minutes."));
            body.Append(SmallText("If you did not request a password reset, please ignore this email and ensure your account is secure."));
            return BuildBaseLayout("Reset Your Password", body.ToString());
        }

        public string BuildPasswordChangedEmail(string userName, string time, string ipAddress, string browser, string device)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your Smart Home Automation account password has been changed successfully."));
            body.Append(InfoCard("Change Details",
                $"Time: {time}<br/>IP Address: {ipAddress}<br/>Browser: {browser}<br/>Device: {device}"));
            body.Append(WarningBanner("If this wasn't you, please contact support immediately to secure your account."));
            body.Append(SecondaryButton("Contact Support", $"mailto:{_configuration["Smtp:SupportEmail"] ?? "support@smarthomeautomation.com"}"));
            return BuildBaseLayout("Password Changed Successfully", body.ToString());
        }

        public string BuildWelcomeEmail(string userName, string verificationLink, string? temporaryPassword)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Welcome {userName}!"));
            body.Append(TextBlock("Your Smart Home Automation account has been created. You can now start managing your smart home devices, monitoring energy usage, and more."));
            if (!string.IsNullOrEmpty(temporaryPassword))
            {
                body.Append(InfoCard("Temporary Password", $"Use the following temporary password to log in: <strong>{temporaryPassword}</strong>"));
                body.Append(TextBlock("Please change your password after logging in."));
            }
            body.Append(TextBlock("Click below to verify your email and activate your account:"));
            body.Append(PrimaryButton("Verify Email", verificationLink));
            body.Append(Divider());
            body.Append(SmallText($"Login URL: {_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/login"));
            body.Append(SmallText($"Support: {_configuration["Smtp:SupportEmail"] ?? "support@smarthomeautomation.com"}"));
            return BuildBaseLayout("Welcome to Smart Home Automation", body.ToString());
        }

        public string BuildAccountDeletedEmail(string userName, string deletionDate, string? reason)
        {
            var supportEmail = _configuration["Smtp:SupportEmail"] ?? "support@smarthomeautomation.com";
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your Smart Home Automation account has been removed by an administrator."));
            body.Append(InfoCard("Account Information",
                $"User: {userName}<br/>Deletion Date: {deletionDate}{(reason != null ? $"<br/>Reason: {reason}" : "")}"));
            body.Append(AlertBox("This action was performed by an administrator. If you believe this was a mistake, please contact our support team."));
            body.Append(SecondaryButton("Contact Support", $"mailto:{supportEmail}"));
            return BuildBaseLayout("Your Smart Home Automation Account Has Been Removed", body.ToString());
        }

        public string BuildAccountLockedEmail(string userName, string time, string ipAddress, string browser, int lockoutMinutes)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your Smart Home Automation account has been temporarily locked due to multiple failed login attempts."));
            body.Append(InfoCard("Lock Details",
                $"Time: {time}<br/>IP Address: {ipAddress}<br/>Browser: {browser}<br/>Lock Duration: {lockoutMinutes} minutes"));
            body.Append(SmallText("You will be able to attempt login again after the lock period ends."));
            body.Append(SmallText("If you did not attempt to log in, please contact support immediately."));
            return BuildBaseLayout("Account Temporarily Locked", body.ToString());
        }

        public string BuildEmailChangeNotificationEmail(string userName, string newEmail)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("A request was made to change the email address associated with your Smart Home Automation account."));
            body.Append(InfoCard("New Email Address", newEmail));
            body.Append(TextBlock("Please verify your new email address by clicking the link sent to it. Your email will not be updated until verification is complete."));
            body.Append(SecurityNotice("If you did not request this change, please contact support immediately."));
            return BuildBaseLayout("Email Change Requested", body.ToString());
        }

        public string BuildEmailChangedConfirmationEmail(string userName, string oldEmail, string newEmail)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your email address has been successfully updated."));
            body.Append(InfoCard("Email Update",
                $"Previous: {oldEmail}<br/>New: {newEmail}"));
            body.Append(SecurityNotice("If you did not make this change, please contact support immediately to secure your account."));
            return BuildBaseLayout("Email Address Updated", body.ToString());
        }

        public string BuildLoginSecurityAlertEmail(string userName, string time, string ipAddress, string browser, string device, string location)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("A new sign-in was detected on your Smart Home Automation account."));
            body.Append(InfoCard("Login Details",
                $"Time: {time}<br/>IP Address: {ipAddress}<br/>Browser: {browser}<br/>Device: {device}<br/>Location: {location}"));
            body.Append(SecurityNotice("If this was you, no action is needed. If you don't recognize this activity, please change your password immediately."));
            body.Append(PrimaryButton("Secure Account", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/profile"));
            return BuildBaseLayout("New Sign-In Alert", body.ToString());
        }

        public string BuildPasswordResetSuccessEmail(string userName)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your Smart Home Automation account password has been reset successfully."));
            body.Append(TextBlock("You can now log in using your new password."));
            body.Append(PrimaryButton("Go to Login", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/login"));
            body.Append(SecurityNotice("If you did not reset your password, please contact support immediately."));
            return BuildBaseLayout("Password Reset Successful", body.ToString());
        }

        public string BuildAiMonthlyReportEmail(string userName, string reportPeriod, string totalEnergy, string avgDailyUsage, string topDevice, string savingsTip, string reportUrl)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock($"Your AI-powered monthly energy report for {reportPeriod} is ready."));
            body.Append(InfoCard("Monthly Summary",
                $"Total Energy: {totalEnergy}<br/>Avg Daily Usage: {avgDailyUsage}<br/>Top Device: {topDevice}"));
            body.Append(AlertBox($"Smart Savings Tip: {savingsTip}", "warning"));
            body.Append(PrimaryButton("View Full Report", reportUrl));
            return BuildBaseLayout($"Monthly Report - {reportPeriod}", body.ToString());
        }

        public string BuildDeviceOfflineAlertEmail(string userName, string deviceName, string roomName, string offlineSince, string deviceType)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock($"Your {deviceName} has been offline for an extended period."));
            body.Append(WarningBanner($"Device: {deviceName} ({deviceType})\nLocation: {roomName}\nOffline Since: {offlineSince}"));
            body.Append(TextBlock("Please check the device connection and power supply."));
            body.Append(PrimaryButton("View Device", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/devices"));
            return BuildBaseLayout($"Device Offline Alert - {deviceName}", body.ToString());
        }

        public string BuildSmokeFireAlertEmail(string userName, string alertType, string location, string detectedAt, string severity, string recommendations)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock($"⚠️ {alertType} detected in your home!"));
            body.Append(WarningBanner($"Type: {alertType}\nLocation: {location}\nDetected At: {detectedAt}\nSeverity: {severity}"));
            body.Append(AlertBox(recommendations, "error"));
            body.Append(SmallText("Please evacuate if necessary and contact emergency services immediately."));
            return BuildBaseLayout($"🚨 {alertType} Alert", body.ToString());
        }

        public string BuildWaterLeakAlertEmail(string userName, string location, string detectedAt, string severity, string recommendations)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("A water leak has been detected in your home."));
            body.Append(WarningBanner($"Location: {location}\nDetected At: {detectedAt}\nSeverity: {severity}"));
            body.Append(AlertBox(recommendations, "warning"));
            body.Append(PrimaryButton("View Details", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/security"));
            return BuildBaseLayout("Water Leak Detected", body.ToString());
        }

        public string BuildHighEnergyUsageAlertEmail(string userName, string currentUsage, string threshold, string period, string tips)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock($"Your energy usage has exceeded the set threshold."));
            body.Append(InfoCard("Energy Alert",
                $"Current Usage: {currentUsage}<br/>Threshold: {threshold}<br/>Period: {period}"));
            body.Append(AlertBox($"Energy Saving Tips: {tips}", "warning"));
            body.Append(PrimaryButton("View Energy Dashboard", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/smart-insights"));
            return BuildBaseLayout("High Energy Usage Alert", body.ToString());
        }

        public string BuildVacationModeEnabledEmail(string userName, string startDate, string endDate, string devicesControlled, string securityStatus)
        {
            var body = new StringBuilder();
            body.Append(TextBlock($"Hello {userName},"));
            body.Append(TextBlock("Your Smart Home has entered Vacation Mode."));
            body.Append(InfoCard("Vacation Settings",
                $"Period: {startDate} - {endDate}<br/>Devices Controlled: {devicesControlled}<br/>Security Status: {securityStatus}"));
            body.Append(TextBlock("Your home will simulate occupancy, optimize energy usage, and maintain security monitoring while you are away."));
            body.Append(SecondaryButton("View Vacation Settings", $"{_configuration["App:BaseUrl"] ?? "http://localhost:5173"}/vacation-mode"));
            return BuildBaseLayout("Vacation Mode Enabled", body.ToString());
        }
    }
}
