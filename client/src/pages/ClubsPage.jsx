import React, { useState } from 'react';
import { FiUsers, FiAward, FiChevronDown, FiChevronUp, FiCalendar, FiUser, FiPlus } from 'react-icons/fi';
import './ClubsPage.css';

const CLUBS_DATA = {
  clubs: [
    {
      id:'c1', name:'Coding Club', icon:'💻', color:'#4f61d2', banner:'#eef1fb',
      desc:'Competitive programming, hackathons and open source contributions.',
      members:120, lead:'Vikram R.',
      activities:[
        { title:'Weekly CP Contest',       freq:'Every Saturday 6 PM', type:'Regular'  },
        { title:'Open Source Sprint',      freq:'Monthly',             type:'Project'  },
        { title:'LeetCode Sessions',        freq:'Wednesdays',          type:'Regular'  },
      ],
    },
    {
      id:'c2', name:'Design Club', icon:'🎨', color:'#8b5cf6', banner:'#f5f3ff',
      desc:'UI/UX, graphic design, motion design and creative workshops.',
      members:85, lead:'Priya K.',
      activities:[
        { title:'Figma Friday Workshop',   freq:'Fridays 5 PM', type:'Workshop' },
        { title:'Design Critique',         freq:'Bi-weekly',    type:'Workshop' },
        { title:'Designathon Prep',        freq:'Monthly',      type:'Event'    },
      ],
    },
    {
      id:'c3', name:'Robotics Club', icon:'🤖', color:'#10b981', banner:'#ecfdf5',
      desc:'Autonomous robots, drone programming and hardware projects.',
      members:60, lead:'Ravi S.',
      activities:[
        { title:'Arduino & ROS Workshop', freq:'Weekends', type:'Workshop' },
        { title:'Line Follower Build',    freq:'Ongoing',  type:'Project'  },
        { title:'Regional Competition',   freq:'Monthly',  type:'Event'    },
      ],
    },
    {
      id:'c4', name:'Photography Club', icon:'📸', color:'#f59e0b', banner:'#fffbeb',
      desc:'Campus photography, photo walks, editing and exhibitions.',
      members:72, lead:'Ananya S.',
      activities:[
        { title:'Campus Photo Walk',      freq:'Monthly',   type:'Event'    },
        { title:'Lightroom Workshop',     freq:'Bi-weekly', type:'Workshop' },
        { title:'Annual Exhibition',      freq:'Yearly',    type:'Event'    },
      ],
    },
    {
      id:'c5', name:'Music Club', icon:'🎵', color:'#ec4899', banner:'#fdf2f8',
      desc:'Jam sessions, live performances, music theory and production.',
      members:55, lead:'Davin B.',
      activities:[
        { title:'Weekly Jam Session',  freq:'Thursdays', type:'Regular'  },
        { title:'Open Mic Night',      freq:'Monthly',   type:'Event'    },
        { title:'Production Workshop', freq:'Monthly',   type:'Workshop' },
      ],
    },
    {
      id:'c6', name:'Entrepreneurship Cell', icon:'🚀', color:'#f97316', banner:'#fff7ed',
      desc:'Startups, pitching, investor connections and ideation sprints.',
      members:94, lead:'Arjun M.',
      activities:[
        { title:'Startup Pitch Night',   freq:'Monthly',  type:'Event'   },
        { title:'Mentor Connect',        freq:'Bi-weekly',type:'Seminar' },
        { title:'Ideation Sprint',       freq:'Quarterly',type:'Workshop'},
      ],
    },
  ],
  societies: [
    {
      id:'s1', name:'IEEE', icon:'⚡', color:'#0ea5e9', banner:'#f0f9ff',
      desc:'Institute of Electrical and Electronics Engineers — global membership & journal access.',
      members:200, lead:'Faculty Advisor',
      activities:[
        { title:'Technical Paper Presentation', freq:'Semester',  type:'Event'      },
        { title:'PCB Design Workshop',          freq:'Monthly',   type:'Workshop'   },
        { title:'IEEE Xtreme Contest',          freq:'Annually',  type:'Competition'},
        { title:'Industry Expert Talks',        freq:'Bi-monthly',type:'Seminar'    },
      ],
    },
    {
      id:'s2', name:'ACM', icon:'💡', color:'#8b5cf6', banner:'#f5f3ff',
      desc:'Association for Computing Machinery — algorithms, AI and software engineering.',
      members:150, lead:'Faculty Advisor',
      activities:[
        { title:'ICPC Practice Sessions',    freq:'Weekly',   type:'Regular'    },
        { title:'Research Reading Group',    freq:'Bi-weekly',type:'Workshop'   },
        { title:'ACM-ICPC Regional',         freq:'Annually', type:'Competition'},
      ],
    },
    {
      id:'s3', name:'GDSC', icon:'🌐', color:'#f43f5e', banner:'#fff1f2',
      desc:'Google Developer Student Club — Flutter, Android, cloud and community projects.',
      members:180, lead:'Arjun M.',
      activities:[
        { title:'Flutter Dev Bootcamp',      freq:'Semester', type:'Workshop'   },
        { title:'Google Cloud Study Jam',    freq:'Monthly',  type:'Workshop'   },
        { title:'Solution Challenge',        freq:'Annually', type:'Competition'},
        { title:'Tech Talks by Googlers',    freq:'Quarterly',type:'Seminar'    },
      ],
    },
    {
      id:'s4', name:'ASME', icon:'⚙️', color:'#f59e0b', banner:'#fffbeb',
      desc:'American Society of Mechanical Engineers — design competitions and standards.',
      members:42, lead:'Faculty Advisor',
      activities:[
        { title:'Student Design Competition', freq:'Annually', type:'Competition'},
        { title:'ASME E-Fest',                freq:'Annually', type:'Event'      },
        { title:'Standards Webinar',          freq:'Quarterly',type:'Workshop'   },
      ],
    },
    {
      id:'s5', name:'SAE India', icon:'🚗', color:'#10b981', banner:'#ecfdf5',
      desc:'Society of Automotive Engineers — BAJA, Formula Bharat and eBAJA competitions.',
      members:55, lead:'Faculty Advisor',
      activities:[
        { title:'BAJA SAE India',    freq:'Annually', type:'Competition'},
        { title:'Formula Bharat',   freq:'Annually', type:'Competition'},
        { title:'Design Seminar',   freq:'Quarterly',type:'Seminar'    },
      ],
    },
  ],
};

const TYPE_COLORS = {
  Regular:'#4f61d2', Workshop:'#8b5cf6', Event:'#10b981',
  Competition:'#f43f5e', Seminar:'#0ea5e9', Project:'#f59e0b',
  Conference:'#ec4899', Research:'#f97316',
};

function OrgCard({ org }) {
  const [open, setOpen] = useState(false);
  const [joined, setJoined] = useState(false);

  return (
    <div className="org-card" style={{ '--c': org.color, '--bg': org.banner }}>
      {/* Card header */}
      <div className="org-card-top" onClick={() => setOpen(!open)}>
        <div className="org-icon-wrap" style={{ background: org.banner, border:`1.5px solid ${org.color}30` }}>
          <span style={{ fontSize:26 }}>{org.icon}</span>
        </div>
        <div className="org-card-info">
          <div className="org-name">{org.name}</div>
          <div className="org-desc">{org.desc}</div>
          <div className="org-meta">
            <span className="org-chip"><FiUser size={10}/> {org.lead}</span>
            <span className="org-chip"><FiUsers size={10}/> {org.members} members</span>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
          <button
            className={`org-join-btn ${joined?'joined':''}`}
            style={joined ? {} : { background:org.color, color:'#fff' }}
            onClick={e => { e.stopPropagation(); setJoined(!joined); }}
          >
            {joined ? '✓ Joined' : <><FiPlus size={12}/> Join</>}
          </button>
          <button className="org-expand-btn" style={{ color:org.color, background:`${org.color}12`, border:`1px solid ${org.color}25` }}>
            {open ? <FiChevronUp size={14}/> : <FiChevronDown size={14}/>}
          </button>
        </div>
      </div>

      {/* Activities panel */}
      {open && (
        <div className="org-activities">
          <div className="activities-label">
            <FiCalendar size={11}/> Activities & Schedule
          </div>
          <div className="activities-grid">
            {org.activities.map((a, i) => (
              <div key={i} className="activity-pill">
                <div className="activity-dot" style={{ background: TYPE_COLORS[a.type]||'#4f61d2' }}/>
                <div className="activity-info">
                  <span className="activity-title">{a.title}</span>
                  <span className="activity-freq">{a.freq}</span>
                </div>
                <span className="activity-badge" style={{ background:`${TYPE_COLORS[a.type]||'#4f61d2'}15`, color:TYPE_COLORS[a.type]||'#4f61d2' }}>
                  {a.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClubsPage() {
  const [activeSection, setActiveSection] = useState('all');

  return (
    <div className="clubs-root">
      {/* Hero */}
      <div className="clubs-hero">
        <div className="clubs-hero-badge">🏛️ Campus Life</div>
        <h1 className="clubs-hero-title">Clubs &amp; Professional Societies</h1>
        <p className="clubs-hero-sub">Discover every student organisation on campus, explore their activities and join the ones that excite you.</p>

        <div className="clubs-filter-tabs">
          {[['all','All'], ['clubs','Clubs'], ['societies','Societies']].map(([id, label]) => (
            <button
              key={id}
              className={`clubs-filter-btn ${activeSection===id?'active':''}`}
              onClick={() => setActiveSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clubs */}
      {(activeSection==='all'||activeSection==='clubs') && (
        <section className="clubs-section">
          <div className="clubs-section-header">
            <div className="section-icon-pill" style={{ background:'rgba(79,97,210,0.1)', color:'#4f61d2' }}>
              <FiUsers size={15}/>
            </div>
            <div>
              <h2 className="clubs-section-title">College Clubs</h2>
              <p className="clubs-section-sub">Student-run interest groups and skill-building circles</p>
            </div>
            <span className="clubs-section-count">{CLUBS_DATA.clubs.length}</span>
          </div>
          <div className="org-grid">
            {CLUBS_DATA.clubs.map(org => <OrgCard key={org.id} org={org}/>)}
          </div>
        </section>
      )}

      {/* Professional Societies */}
      {(activeSection==='all'||activeSection==='societies') && (
        <section className="clubs-section">
          <div className="clubs-section-header">
            <div className="section-icon-pill" style={{ background:'rgba(139,92,246,0.1)', color:'#8b5cf6' }}>
              <FiAward size={15}/>
            </div>
            <div>
              <h2 className="clubs-section-title">Professional Societies</h2>
              <p className="clubs-section-sub">Global professional memberships and student chapters</p>
            </div>
            <span className="clubs-section-count">{CLUBS_DATA.societies.length}</span>
          </div>
          <div className="org-grid">
            {CLUBS_DATA.societies.map(org => <OrgCard key={org.id} org={org}/>)}
          </div>
        </section>
      )}
    </div>
  );
}