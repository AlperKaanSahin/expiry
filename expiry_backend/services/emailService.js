const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendWelcomeEmail = async (to, firstName) => {
  console.log("sendWelcomeEmail çağrıldı:", to);

  try {
    

    const result = await resend.emails.send({
      from: 'Expiry <onboarding@resend.dev>',
      to,
      subject: 'Expiry\'e Hoş Geldin!',
html: `
  <div style="font-family: Arial, sans-serif; background-color:#f6f8fb; padding:20px;">
    
    <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #eaeaea;">
      
      <!-- HEADER -->
      <div style="background:#1B8A5A; padding:20px; text-align:center;">
        <h1 style="color:#ffffff; margin:0; font-size:20px;">
          Expiry
        </h1>
      </div>

      <!-- BODY -->
      <div style="padding:30px;">
        <h2 style="color:#1B8A5A; margin-bottom:10px;">
          Hoş geldin, ${firstName} 👋
        </h2>

        <p style="color:#333; font-size:15px; line-height:1.6;">
          Hesabın başarıyla oluşturuldu.
        </p>

        <p style="color:#333; font-size:15px; line-height:1.6;">
          Artık çevrendeki marketlerde son kullanma tarihi yaklaşan ürünleri daha uygun fiyatlarla keşfedebilirsin.
        </p>

        <div style="margin-top:20px; padding:15px; background:#f0faf5; border-left:4px solid #1B8A5A;">
          <p style="margin:0; color:#1B8A5A; font-weight:bold;">
            🚀 Başlamak için uygulamaya giriş yapabilirsin.
          </p>
        </div>

        <p style="margin-top:30px; font-size:12px; color:#888;">
          Bu otomatik bir bilgilendirme mailidir.
        </p>
      </div>

      <!-- FOOTER -->
      <div style="background:#fafafa; padding:15px; text-align:center; font-size:12px; color:#999;">
        © ${new Date().getFullYear()} Expiry. Tüm hakları saklıdır.
      </div>

    </div>
  </div>
`
    });

    

  } catch (err) {
    console.error("RESEND ERROR:", err);
  }
};