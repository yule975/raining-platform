import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const Login = () => {
  const navigate = useNavigate();

  const handleStudentLogin = () => {
    navigate('/student-login');
  };

  const handleAdminLogin = () => {
    navigate('/admin-login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroBanner})` }}
      />
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      
      {/* Login Card */}
      <Card className="w-full max-w-md mx-4 shadow-floating backdrop-blur-sm bg-card/95 border-0">
        <CardHeader className="text-center pb-4">
          {/* Platform Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          
          {/* Welcome Text */}
          <h1 className="text-3xl font-bold text-foreground mb-2">
            欢迎来到训战营学习平台
          </h1>
          <p className="text-muted-foreground text-lg">
            请选择登录方式
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Student Login Button */}
          <Button 
            onClick={handleStudentLogin}
            className="w-full h-12 text-lg font-medium bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-secondary-foreground/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold">学</span>
              </div>
              <span>学员登录</span>
            </div>
          </Button>

          {/* Admin Login Button */}
          <Button 
            onClick={handleAdminLogin}
            className="w-full h-12 text-lg font-medium bg-red-600 hover:bg-red-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs font-bold">管</span>
              </div>
              <span>管理员登录</span>
            </div>
          </Button>
          
          {/* Helper Text */}
          <p className="text-center text-sm text-muted-foreground">
            根据您的身份选择相应的登录方式
          </p>
          
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;