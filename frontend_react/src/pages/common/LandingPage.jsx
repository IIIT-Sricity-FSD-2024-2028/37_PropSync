import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTools,
  FaUserCog,
  FaChartLine,
  FaComments,
  FaBolt,
  FaFacebookF,
  FaLinkedinIn,
  FaTwitter,
  FaInstagram,
  FaGithub,
  FaYoutube,
} from "react-icons/fa";
import "./LandingPage.css";

const ROTATING_WORDS = ["Smarter", "Faster", "Efficient", "Reliable"];

const SOLUTIONS = [
  { Icon: FaTools, title: "Centralized Maintenance Requests", desc: "All maintenance issues organized in one platform for easy tracking." },
  { Icon: FaUserCog, title: "Efficient Service Coordination", desc: "Managers assign and monitor service providers more effectively." },
  { Icon: FaChartLine, title: "Real-Time Task Tracking", desc: "Stay updated on the progress of maintenance work at every stage." },
  { Icon: FaComments, title: "Improved Communication", desc: "Ensure smooth collaboration between all maintenance stakeholders." },
  { Icon: FaBolt, title: "Better Operational Efficiency", desc: "Reduce delays and maintain properties with greater organization." },
];

const WORKFLOW = [
  { id: 1, title: "1. Submit Request", img: "/Images/Submit-Request.png", desc: "Report maintenance issue" },
  { id: 2, title: "2. Review Request", img: "/Images/Review-Request.png", desc: "Manager reviews the request" },
  { id: 3, title: "3. Assign Provider", img: "/Images/Assign-Provider.png", desc: "Assign to service provider" },
  { id: 4, title: "4. Track Progress", img: "/Images/Track-Progress.png", desc: "Monitor task status" },
  { id: 5, title: "5. Resolve Issue", img: "/Images/Reslove-Issue.png", desc: "Complete and close task" },
];

const REVIEWS = [
  { quote: "Managing maintenance requests has never been this easy. Everything is streamlined and stress-free.", name: "Ravi Kumar", role: "Property Owner" },
  { quote: "The service coordination is incredibly fast. I can assign and track tasks in seconds.", name: "Anjali Mehta", role: "Maintenance manager" },
  { quote: "Clear communication and zero confusion. This system saves us hours every week.", name: "Rahul Sharma", role: "Service Provider" },
];

const CHALLENGES = [
  { title: "Unorganized Maintenance Requests", desc: "Maintenance issues can come from different sources, making them difficult to track." },
  { title: "Difficult Service Coordination", desc: "Assigning and managing service providers without a centralized system slows down operations." },
  { title: "Limited Visibility of Ongoing Tasks", desc: "Stakeholders struggle to monitor the status and progress of maintenance activities." },
  { title: "Delayed Problem Resolution", desc: "Without proper coordination, maintenance tasks take longer to resolve." },
];

const ROLES = [
  { title: "Admin", img: "/Images/Admin.png", desc: "Manage users, oversee operations, and ensure the system runs smoothly." },
  { title: "Owner", img: "/Images/Owner.png", desc: "Raise maintenance requests and stay updated on repair progress." },
  { title: "Maintenance Manager", img: "/Images/Maintenance%20manager.png", desc: "Receive and manage requests, assign tasks, and ensure timely repairs." },
  { title: "Service Provider", img: "/Images/Service%20Provider.png", desc: "Technicians and contractors who execute maintenance and report status." },
];

export default function LandingPage() {
  const [activeNav, setActiveNav] = useState("home");
  const [wordIdx, setWordIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (e, id) => {
    e.preventDefault();
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const dashboardRoute = () => {
    const r = currentUser?.role;
    if (r === "owner") return "/owner/dashboard";
    if (r === "service_provider") return "/service-provider/dashboard";
    if (r === "maintenance_manager" || r === "manager") return "/maintenance_manager/dashboard";
    if (r === "admin" || r === "administrator") return "/admin/dashboard";
    if (r === "super_user") return "/super_user/dashboard";
    return "/dashboard";
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <a href="#home" className="logo" onClick={(e) => scrollTo(e, "home")} aria-label="PropSync">
          <img src="/image.png" alt="PropSync" />
        </a>
        <nav className="nav">
          {["home", "solutions", "workflow", "reviews", "contact"].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className={activeNav === id ? "active" : ""}
              onClick={(e) => scrollTo(e, id)}
            >
              {id === "home" ? "Home" : id === "workflow" ? "How it works" : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </nav>
        <div className="auth-actions">
          {currentUser ? (
            <Link to={dashboardRoute()} className="dashboard-btn">
              Dashboard ({currentUser.role?.replace("_", " ")})
            </Link>
          ) : (
            <>
              <Link to="/login" className="login">Log in</Link>
              <Link to="/signup" className="signup">Sign Up</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <div className="container">
        <section className="hero" id="home">
          <h1>
            <span className="hero-word" key={wordIdx}>
              {ROTATING_WORDS[wordIdx]}
            </span>
            Property Maintenance starts here
          </h1>
          <p>Fast, organized, and reliable maintenance</p>
          <div className="features">
            <span>Easy Requests</span>
            <span>Quick Resolution</span>
            <span>Real-Time Tracking</span>
            <span>Service Coordination</span>
          </div>
        </section>
      </div>

      {/* Intro */}
      <section className="intro">
        <div className="intro-text">
          <h2>Maintenance shouldn’t slow your property down — it should keep your property moving forward.</h2>
          <p>Empowering property managers with a smart platform to streamline maintenance operations and coordinate services efficiently.</p>
          <Link to="/signup" className="btn">Register Now</Link>
        </div>
        <div className="intro-image">
          <img src="/Images/ServiceProviderDashboard.jpeg" alt="PropSync Dashboard Preview" />
        </div>
      </section>

      {/* Challenges */}
      <section className="challenges-container">
        <div className="image-side">
          <div className="image-placeholder">
            <img src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Building Community" />
          </div>
        </div>
        <div className="scroll-side">
          <div className="scroll-header">
            <h2>Real-World Challenges</h2>
            <p>Maintenance Operations Are Often Slowed Down by Outdated Processes</p>
          </div>
          <div className="marquee-viewport">
            <div className="marquee-content">
              {[...CHALLENGES, ...CHALLENGES.slice(0, 2)].map((c, i) => (
                <div className="card" key={i}>
                  <h3>{c.title}</h3>
                  <p>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions */}
      <section className="section" id="solutions">
        <div className="container">
          <h2>A Unified Platform for Smarter<br />Maintenance Management</h2>
          <p className="section-sub">Smart tools purpose-built for property managers and service teams</p>
          <div className="boxes">
            {SOLUTIONS.map((s, i) => {
              const Icon = s.Icon;
              return (
                <div className="box" key={i}>
                  <div className="box-icon-wrap"><Icon /></div>
                  <h5>{s.title}</h5>
                  <p>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stakeholder Ecosystem */}
      <section className="maintenance-section">
        <div className="diagram-column">
          <div className="diagram-grid">
            <div className="center-logo">
              <img src="/favicon.png" alt="PropSync" />
            </div>
            {ROLES.map((r, i) => {
              const positions = ["node-top-right", "node-top-left", "node-bottom-right", "node-bottom-left"];
              return (
                <div key={r.title} className={`node ${positions[i]}`}>
                  <div className="circle-img"><img src={r.img} alt={r.title} /></div>
                  <p>{r.title}</p>
                </div>
              );
            })}
            <svg className="connecting-arrows" viewBox="0 0 420 420">
              <defs>
                <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#1c2947" />
                </marker>
              </defs>
              <line x1="170" y1="170" x2="90" y2="90" stroke="#1c2947" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="250" y1="170" x2="330" y2="90" stroke="#1c2947" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="170" y1="250" x2="90" y2="330" stroke="#1c2947" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="250" y1="250" x2="330" y2="330" stroke="#1c2947" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>
          </div>
        </div>
        <div className="content-column">
          <h2 className="heading">Maintenance That Works for Everyone</h2>
          <p className="description">Bring all stakeholders onto one platform and watch efficiency, clarity, and collaboration thrive.</p>
          <div className="card-viewport">
            <div className="card-track">
              {ROLES.map((r) => (
                <div className="info-card" key={r.title}>
                  <div className="card-circle"><img src={r.img} alt={r.title} /></div>
                  <div className="card-text">
                    <h3>{r.title}</h3>
                    <p>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="section" id="workflow">
        <div className="container">
          <h2>How the Maintenance Workflow operates</h2>
          <p className="section-sub">Simple, step-by-step process to manage maintenance efficiently</p>
          <div className="workflow">
            {WORKFLOW.map((step, i) => (
              <div key={step.id} style={{ display: "contents" }}>
                <div className="step">
                  <h4>{step.title}</h4>
                  <img src={step.img} alt={step.title} />
                  <p>{step.desc}</p>
                </div>
                {i < WORKFLOW.length - 1 && (
                  <div className="arrow"><div className="arrow-inner"></div></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="container">
        <section className="stats-container">
          <h2>Get results that matter</h2>
          <div className="stats-row">
            {[
              { val: "35%", text: "Faster Issue Resolution" },
              { val: "50%", text: "Less Manual Work" },
              { val: "40%", text: "Better Team Coordination" },
              { val: "24/7", text: "Request Tracking" },
            ].map((s, i) => (
              <div className="stats-box" key={i}>
                <h3>{s.val}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Testimonials */}
      <section className="testimonials" id="reviews">
        <div className="container">
          <h2>What Our Users Say</h2>
          <p className="subtitle">Real feedback from property owners and managers</p>
          <div className="testimonial-grid">
            {REVIEWS.map((r, i) => (
              <div className="secondary-card" key={i}>
                <div>
                  <div className="quote">“</div>
                  <div className="stars">★★★★★</div>
                  <p className="message">{r.quote}</p>
                </div>
                <div className="user">
                  <h4>{r.name}</h4>
                  <span>{r.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>Ready to Simplify Property Maintenance?</h2>
        <p className="cta-subtext">Streamline maintenance requests, track tasks in real time, and improve coordination across all properties.</p>
        <div className="cta-actions">
          <Link to="/signup" className="register">Register Now →</Link>
          <Link to="/login" className="btn-login">Login</Link>
        </div>
        <p className="cta-footer">Start managing maintenance smarter today. No credit card required.</p>
      </section>

      {/* Footer */}
      <footer className="propsync-footer" id="contact">
        <div className="footer-container">
          <div className="footer-brand-section">
            <a href="#home" onClick={(e) => scrollTo(e, "home")} aria-label="PropSync">
              <img src="/image.png" alt="PropSync" className="footer-logo-img" />
            </a>
            <p className="brand-tagline">Property Maintenance and Service Coordination</p>
            <p className="brand-bio">The complete platform for property managers, technicians, and property owners.</p>
            <div className="newsletter-block">
              <h4>Subscribe to our newsletter</h4>
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) {
                    setSubscribed(true);
                    setNewsletterEmail("");
                    setTimeout(() => setSubscribed(false), 3000);
                  }
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit">Subscribe</button>
              </form>
              {subscribed && <p style={{ color: "#34a853", fontSize: "13px", marginTop: "6px" }}>Thank you for subscribing!</p>}
            </div>
          </div>
          <div className="footer-nav-grid">
            {[
              { title: "Features", links: ["Smart Scheduling", "Service Tracking", "Issue Reporting", "Vendor Management", "Work Orders"] },
              { title: "Company", links: ["About Us", "Careers", "Blog", "Press", "Contact"] },
              { title: "Resources", links: ["Documentation", "Help Center", "API Reference", "Community", "Webinars"] },
              { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "Security", "Compliance"] },
            ].map((col) => (
              <div className="nav-col" key={col.title}>
                <h3>{col.title}</h3>
                <ul>
                  {col.links.map((link) => (
                    <li key={link}><a href="#solutions">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="footer-social-row">
          <div className="social-wrapper">
            {[
              { Icon: FaFacebookF, label: "Facebook", href: "https://facebook.com" },
              { Icon: FaLinkedinIn, label: "LinkedIn", href: "https://linkedin.com" },
              { Icon: FaTwitter, label: "Twitter", href: "https://twitter.com" },
              { Icon: FaInstagram, label: "Instagram", href: "https://instagram.com" },
              { Icon: FaGithub, label: "GitHub", href: "https://github.com" },
              { Icon: FaYoutube, label: "YouTube", href: "https://youtube.com" },
            ].map(({ Icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="social-link" aria-label={label}>
                <Icon />
                <span>{label}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="bottom-content">
          <p>&copy; 2026 PropSync. All rights reserved.</p>
          <div className="utility-links">
            <a href="#home">Sitemap</a>
            <a href="#home">Accessibility</a>
            <a href="#home">System Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
