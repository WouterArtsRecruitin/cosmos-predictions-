export default function Home() {
  return (
    <>
      <head>
        <title>Tech Talent Insights - Recruitin</title>
        <meta name="description" content="Ontvang maandelijks arbeidsmarkt insights voor technische en industriële sectoren in Midden-Oost en Zuid Nederland." />
      </head>
      
      <div dangerouslySetInnerHTML={{
        __html: `
<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
            color: #4A4A4A;
            line-height: 1.6;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, #4A4A4A 0%, #2a2a2a 100%);
            padding: 20px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .header .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            max-width: 180px;
            height: auto;
        }
        
        .header-links a {
            color: #F5A623;
            text-decoration: none;
            margin-left: 25px;
            font-size: 14px;
            font-weight: 600;
        }
        
        .header-links a:hover {
            text-decoration: underline;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(135deg, #4A4A4A 0%, #2a2a2a 100%);
            color: white;
            padding: 80px 0;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 48px;
            font-weight: 700;
            margin-bottom: 20px;
            line-height: 1.2;
        }
        
        .hero .highlight {
            color: #F5A623;
        }
        
        .hero .tagline {
            font-size: 24px;
            font-style: italic;
            color: #F5A623;
            margin-bottom: 15px;
        }
        
        .hero .subtitle {
            font-size: 18px;
            color: #cccccc;
            max-width: 700px;
            margin: 0 auto 30px;
        }
        
        .hero .stats {
            display: flex;
            justify-content: center;
            gap: 50px;
            margin-top: 40px;
            flex-wrap: wrap;
        }
        
        .hero .stat {
            text-align: center;
        }
        
        .hero .stat-number {
            font-size: 36px;
            font-weight: 700;
            color: #F5A623;
            display: block;
        }
        
        .hero .stat-label {
            font-size: 14px;
            color: #cccccc;
            margin-top: 5px;
        }
        
        /* Benefits Section */
        .benefits {
            background: white;
            padding: 60px 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 36px;
            font-weight: 700;
            color: #4A4A4A;
            margin-bottom: 50px;
        }
        
        .benefits-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .benefit-card {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            border-left: 4px solid #F5A623;
            transition: transform 0.2s;
        }
        
        .benefit-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .benefit-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .benefit-title {
            font-size: 20px;
            font-weight: 700;
            color: #4A4A4A;
            margin-bottom: 10px;
        }
        
        .benefit-description {
            font-size: 15px;
            color: #555;
            line-height: 1.6;
        }
        
        /* Form Section */
        .form-section {
            background: linear-gradient(to bottom, #f8f9fa, #e5e7eb);
            padding: 60px 0;
        }
        
        .form-container {
            max-width: 700px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        }
        
        .form-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .form-header h2 {
            font-size: 32px;
            font-weight: 700;
            color: #4A4A4A;
            margin-bottom: 10px;
        }
        
        .form-header p {
            font-size: 16px;
            color: #777;
        }
        
        .form-accent {
            height: 4px;
            background: #F5A623;
            margin: 20px 0 30px;
            border-radius: 2px;
        }
        
        /* Jotform Embed */
        .jotform-container {
            width: 100%;
            position: relative;
        }
        
        .jotform-embed {
            width: 100%;
            height: 700px;
            border: none;
        }
        
        /* Trust Indicators */
        .trust {
            background: white;
            padding: 40px 0;
            text-align: center;
        }
        
        .trust-badges {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 30px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .trust-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #777;
            font-size: 14px;
        }
        
        .trust-icon {
            font-size: 20px;
            color: #48BB78;
        }
        
        /* Footer */
        .footer {
            background: #4A4A4A;
            color: white;
            padding: 40px 0;
            text-align: center;
        }
        
        .footer .brand {
            font-size: 24px;
            font-weight: 700;
            color: #F5A623;
            margin-bottom: 10px;
        }
        
        .footer .tagline {
            font-style: italic;
            color: #F5A623;
            font-size: 16px;
            margin-bottom: 20px;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-links a {
            color: #F5A623;
            text-decoration: none;
            margin: 0 15px;
            font-size: 14px;
        }
        
        .footer-links a:hover {
            text-decoration: underline;
        }
        
        .footer-meta {
            color: #999;
            font-size: 12px;
            margin-top: 20px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 36px;
            }
            
            .hero .tagline {
                font-size: 20px;
            }
            
            .hero .subtitle {
                font-size: 16px;
            }
            
            .hero .stats {
                gap: 30px;
            }
            
            .hero .stat-number {
                font-size: 28px;
            }
            
            .section-title {
                font-size: 28px;
            }
            
            .benefits-grid {
                grid-template-columns: 1fr;
            }
            
            .form-container {
                padding: 30px 20px;
            }
            
            .header-links {
                display: none;
            }
            
            .logo {
                max-width: 140px;
            }
            
            .jotform-embed {
                height: 650px;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="container">
            <img src="https://recruitin.nl/wp-content/uploads/2024/logo-wit.png" alt="Recruitin" class="logo">
            <div class="header-links">
                <a href="https://www.recruitin.nl">Website</a>
                <a href="mailto:artsrecruitin@gmail.com">Contact</a>
                <a href="tel:0614314583">06-14314583</a>
            </div>
        </div>
    </header>
    
    <!-- Hero Section -->
    <section class="hero">
        <div class="container">
            <h1>
                Blijf Voorop met<br>
                <span class="highlight">Tech Talent Insights</span>
            </h1>
            <p class="tagline">The right people, right now</p>
            <p class="subtitle">
                Ontvang maandelijks data-gedreven inzichten over de technische arbeidsmarkt in Midden-Oost en Zuid Nederland. Salaris benchmarks, vacature trends en HR tips - direct in je inbox.
            </p>
            
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">1x/maand</span>
                    <span class="stat-label">Elke 1e maandag</span>
                </div>
                <div class="stat">
                    <span class="stat-number">100% Gratis</span>
                    <span class="stat-label">Geen verplichtingen</span>
                </div>
                <div class="stat">
                    <span class="stat-number">5 min</span>
                    <span class="stat-label">Leestijd per editie</span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Benefits Section -->
    <section class="benefits">
        <div class="container">
            <h2 class="section-title">Wat krijg je elke maand?</h2>
            
            <div class="benefits-grid">
                <div class="benefit-card">
                    <span class="benefit-icon">📊</span>
                    <h3 class="benefit-title">Arbeidsmarkt Data</h3>
                    <p class="benefit-description">
                        Actuele cijfers over vacatures, groei en vraag in jouw regio. Specifiek voor technische en industriële sectoren.
                    </p>
                </div>
                
                <div class="benefit-card">
                    <span class="benefit-icon">💰</span>
                    <h3 class="benefit-title">Salaris Benchmarks</h3>
                    <p class="benefit-description">
                        Up-to-date salarisranges voor junior, medior en senior functies in de techniek. Inclusief regio-verschillen.
                    </p>
                </div>
                
                <div class="benefit-card">
                    <span class="benefit-icon">📈</span>
                    <h3 class="benefit-title">Vacature Trends</h3>
                    <p class="benefit-description">
                        Welke functies zijn hot? Waar zijn de grootste tekorten? Welke skills worden gezocht? Data-gedreven analyses.
                    </p>
                </div>
                
                <div class="benefit-card">
                    <span class="benefit-icon">💼</span>
                    <h3 class="benefit-title">HR Tips & Strategieën</h3>
                    <p class="benefit-description">
                        Praktische recruitment tips voor krappe arbeidsmarkt. Van MBO-talent tot competentiegericht werven.
                    </p>
                </div>
                
                <div class="benefit-card">
                    <span class="benefit-icon">📅</span>
                    <h3 class="benefit-title">Industrie Nieuws</h3>
                    <p class="benefit-description">
                        Events, subsidies (WBSO), conferenties en belangrijke updates voor de technische sector in Nederland.
                    </p>
                </div>
                
                <div class="benefit-card">
                    <span class="benefit-icon">🎯</span>
                    <h3 class="benefit-title">Regio-Specifiek</h3>
                    <p class="benefit-description">
                        Focus op Noord-Brabant, Utrecht, Gelderland en Limburg. Brainport, Utrecht Science Park, en meer.
                    </p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Form Section -->
    <section class="form-section">
        <div class="container">
            <div class="form-container">
                <div class="form-header">
                    <h2>Schrijf je gratis in</h2>
                    <p>Ontvang de eerste editie begin volgende maand</p>
                </div>
                
                <div class="form-accent"></div>
                
                <!-- Jotform Embed -->
                <div class="jotform-container">
                    <iframe
                        src="https://form.jotform.com/252753472631054"
                        frameborder="0"
                        class="jotform-embed"
                        scrolling="yes"
                        title="Nieuwsbrief Inschrijving"
                        allow="geolocation; microphone; camera"
                    ></iframe>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Trust Indicators -->
    <section class="trust">
        <div class="container">
            <div class="trust-badges">
                <div class="trust-badge">
                    <span class="trust-icon">✓</span>
                    <span>100% Gratis</span>
                </div>
                <div class="trust-badge">
                    <span class="trust-icon">✓</span>
                    <span>GDPR-proof</span>
                </div>
                <div class="trust-badge">
                    <span class="trust-icon">✓</span>
                    <span>Altijd uitschrijven</span>
                </div>
                <div class="trust-badge">
                    <span class="trust-icon">✓</span>
                    <span>Geen spam</span>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <p class="brand">recruitin</p>
            <p class="tagline">the right people, right now</p>
            
            <p style="margin: 20px 0; color: #cccccc;">
                Data-driven recruitment voor de technische en industriële sector<br>
                Midden-Oost en Zuid Nederland
            </p>
            
            <div class="footer-links">
                <a href="https://www.recruitin.nl">Website</a>
                <a href="mailto:artsrecruitin@gmail.com">Email</a>
                <a href="tel:0614314583">06-14314583</a>
                <a href="https://recruitin.nl/privacy">Privacy</a>
            </div>
            
            <p class="footer-meta">
                © 2025 Recruitin B.V. • Nederland • KvK: 12345678
            </p>
        </div>
    </footer>
</body>
</html>
        `
      }} />
    </>
  );
}