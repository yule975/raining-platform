import React from 'react';
import { Video } from 'lucide-react';

interface FeishuVideoPlayerProps {
  videoUrl: string;
  title?: string;
  className?: string;
}

const FeishuVideoPlayer: React.FC<FeishuVideoPlayerProps> = ({ 
  videoUrl, 
  title = "课程视频", 
  className = "" 
}) => {
  // 检查是否是飞书链接
  const isFeishuLink = videoUrl.includes('feishu.cn') || videoUrl.includes('larksuite.com');
  
  // 检查是否是YouTube链接
  const isYouTubeLink = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  
  // 处理飞书视频链接
  const processFeishuUrl = (url: string) => {
    // 飞书视频链接通常需要特殊处理
    // 这里提供一个基本的处理方式
    if (url.includes('/docx/')) {
      // 对于飞书文档中的视频，可能需要转换为嵌入格式
      return url.replace('/docx/', '/embed/');
    }
    return url;
  };
  
  // 处理YouTube链接
  const processYouTubeUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  
  const getEmbedUrl = () => {
    if (isFeishuLink) {
      return processFeishuUrl(videoUrl);
    }
    if (isYouTubeLink) {
      return processYouTubeUrl(videoUrl);
    }
    return videoUrl;
  };
  
  const embedUrl = getEmbedUrl();
  
  // 如果是无效的飞书链接，显示提示信息
  if (isFeishuLink && videoUrl.includes('video123')) {
    return (
      <div className={`w-full h-full flex items-center justify-center text-white bg-gray-900 ${className}`}>
        <div className="text-center p-8">
          <Video className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <p className="text-lg mb-2">飞书视频暂时无法播放</p>
          <p className="text-sm opacity-60 mb-4">
            飞书视频链接需要特殊的嵌入权限和配置
          </p>
          <div className="text-xs opacity-40 bg-gray-800 p-3 rounded">
            <p>当前链接: {videoUrl}</p>
            <p className="mt-2">请联系管理员配置正确的视频链接</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={embedUrl}
        className="w-full h-full"
        frameBorder="0"
        allowFullScreen
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
      />
    </div>
  );
};

export default FeishuVideoPlayer;