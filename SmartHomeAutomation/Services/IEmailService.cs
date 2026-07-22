namespace SmartHomeAutomation.Services
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(int? userId, string recipient, string subject, string body, string type);
        SmtpConfigStatus GetConfigStatus();
    }
}
