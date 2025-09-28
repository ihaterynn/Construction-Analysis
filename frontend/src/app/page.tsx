import Link from "next/link";
import Navigation from "@/components/Navigation";
import { 
  CloudArrowUpIcon, 
  EyeIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CpuChipIcon
} from "@heroicons/react/24/outline";

export default function Home() {
  const features = [
    {
      title: "AI-Powered Detection",
      description: "Advanced object detection for construction floor plans",
      icon: CpuChipIcon,
      color: "text-blue-600"
    },
    {
      title: "Safety Monitoring",
      description: "Real-time safety equipment and hazard identification",
      icon: ShieldCheckIcon,
      color: "text-green-600"
    },
    {
      title: "Analytics Dashboard",
      description: "Comprehensive insights and reporting capabilities",
      icon: ChartBarIcon,
      color: "text-purple-600"
    }
  ];

  const quickActions = [
    {
      href: "/upload",
      title: "Upload Floorplan",
      description: "Upload and analyze construction site images",
      icon: CloudArrowUpIcon,
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      href: "/review",
      title: "Review Results",
      description: "View and manage detection results",
      icon: EyeIcon,
      color: "bg-green-600 hover:bg-green-700"
    },
    {
      href: "/chat",
      title: "AI Assistant",
      description: "Chat with our AI for insights and analysis",
      icon: ChatBubbleLeftRightIcon,
      color: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Construction Site
            <span className="text-gradient block">Intelligence Platform</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Leverage advanced AI and computer vision to enhance safety, efficiency, 
            and compliance across your construction projects.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/upload" 
              className="axium-button-primary inline-flex items-center justify-center text-lg"
            >
              <CloudArrowUpIcon className="w-6 h-6 mr-2" />
              Start Analysis
            </Link>
            <Link 
              href="/review" 
              className="axium-button-secondary inline-flex items-center justify-center text-lg"
            >
              <EyeIcon className="w-6 h-6 mr-2" />
              View Results
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="axium-card p-8 text-center hover:shadow-lg transition-shadow">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="group axium-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${action.color} mb-4 transition-colors`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="axium-card p-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Platform Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">99.2%</div>
              <div className="text-sm text-gray-600">Detection Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-sm text-gray-600">Monitoring</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50ms</div>
              <div className="text-sm text-gray-600">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">100+</div>
              <div className="text-sm text-gray-600">Object Classes</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
