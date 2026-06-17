import React from 'react';
import {
  Users,
  Target,
  BarChart,
  Zap,
  Bell,
  LineChart,
  ArrowRight,
  Play
} from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onGo }) => {
  const handleGetStarted = () => {
    if (onGo) {
      onGo(2024, 'Lok Sabha', 'Uttar Pradesh'); // Default to a populated state
    }
  };

  return (
    <div className="landing-page">
      {/* Section 1: Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>India's Most Comprehensive Election Analytics Platform</h1>
            <p className="hero-subtext">
              Real-time insights, booth-level data, and historical trends at your fingertips.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={handleGetStarted}>
                Get Started <ArrowRight size={18} />
              </button>
              <button className="btn-secondary">
                <Play size={18} /> Watch Demo
              </button>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-placeholder-img">
              {/* This would be the dashboard screenshot from the image */}
              <div className="mock-dashboard">
                <div className="mock-sidebar"></div>
                <div className="mock-main">
                   <div className="mock-header"></div>
                   <div className="mock-stats">
                     <div className="mock-stat"></div>
                     <div className="mock-stat"></div>
                     <div className="mock-stat"></div>
                   </div>
                   <div className="mock-chart"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Process */}
      <section className="process-section">
        <div className="container">
          <div className="section-header">
            <span className="badge">Process</span>
            <h2>Simple & Powerful Analysis</h2>
            <p>Our streamlined workflow helps you dive deep into election data with ease.</p>
          </div>

          <div className="process-steps">
            <div className="step">
              <div className="step-number">01</div>
              <div className="step-icon">
                <Users size={32} />
              </div>
              <h3>Select Election Type</h3>
              <p>Choose between Lok Sabha or Assembly elections to start your analysis.</p>
            </div>
            <div className="step">
              <div className="step-number">02</div>
              <div className="step-icon">
                <Target size={32} />
              </div>
              <h3>Filter by Region</h3>
              <p>Narrow down your search by State and Constituency to find specific results.</p>
            </div>
            <div className="step">
              <div className="step-number">03</div>
              <div className="step-icon">
                <BarChart size={32} />
              </div>
              <h3>Analyze Results</h3>
              <p>Explore detailed vote shares, booth-level data, and historical performance trends.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Features */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="badge">Features</span>
            <h2>Everything you need to succeed</h2>
            <p>Powerful features to help you understand election dynamics and stay informed.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon zap">
                <Zap size={24} />
              </div>
              <h3>Booth-Level Granularity</h3>
              <p>Access hyper-local data down to individual polling stations for unprecedented detail.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon bell">
                <Bell size={24} />
              </div>
              <h3>Historical Comparisons</h3>
              <p>Compare current results with previous election cycles to identify shifts and trends.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon chart">
                <LineChart size={24} />
              </div>
              <h3>Actionable Insights</h3>
              <p>Deep dive into performance metrics with customizable dashboards and real-time reporting.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
