import React from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Heart, Shield, Compass, Mail } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200/60 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md mt-auto py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <CalendarDays className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                EventSphere
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Modern event management platform for creators, communities, and tech leaders worldwide.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-500" />
              <span>Explore</span>
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/events" className="hover:text-indigo-500 transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link to="/events?platform=online" className="hover:text-indigo-500 transition-colors">
                  Virtual Summits
                </Link>
              </li>
              <li>
                <Link to="/events?platform=onsite" className="hover:text-indigo-500 transition-colors">
                  In-Person Workshops
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-500" />
              <span>Organizers</span>
            </h4>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li>
                <Link to="/profile" className="hover:text-indigo-500 transition-colors">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-indigo-500 transition-colors">
                  Organizer Guidelines
                </Link>
              </li>
              <li>
                <Link to="/my-registrations" className="hover:text-indigo-500 transition-colors">
                  Attendee Verification
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-pink-500" />
              <span>Platform</span>
            </h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Built with React 19, Tailwind CSS, Express 5, and Neon PostgreSQL.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 gap-3">
          <p>© 2026 EventSphere. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for event organizers everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
