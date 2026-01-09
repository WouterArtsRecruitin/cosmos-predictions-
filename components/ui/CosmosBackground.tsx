import React, { useEffect, useRef } from 'react';

export const CosmosBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const stars: Star[] = [];
    const starCount = 1500;
    let centerX = width / 2;
    let centerY = height / 2;

    class Star {
      x: number;
      y: number;
      z: number; // Depth
      size: number;
      color: string;
      originalX: number;
      originalY: number;

      constructor() {
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = Math.random() * width;
        this.originalX = this.x;
        this.originalY = this.y;
        this.size = Math.random() * 2;
        
        // Cosmos colors: Purple, Pink, Blue, White
        const colors = ['#A855F7', '#EC4899', '#3B82F6', '#FFFFFF', '#E0E7FF'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }

      update(speed: number) {
        this.z -= speed;
        
        // Reset if star passes camera
        if (this.z <= 0) {
          this.z = width;
          this.x = (Math.random() - 0.5) * width * 2;
          this.y = (Math.random() - 0.5) * height * 2;
        }
      }

      draw() {
        if (!ctx) return;
        
        // Perspective projection
        const x = (this.x / this.z) * width + centerX;
        const y = (this.y / this.z) * height + centerY;
        
        // Size based on depth
        const radius = Math.max(0.1, (1 - this.z / width) * this.size * 2);
        
        // Opacity based on depth
        const opacity = 1 - this.z / width;

        if (x < 0 || x > width || y < 0 || y > height) return;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    // Initialize stars
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star());
    }

    let speed = 2;
    let time = 0;

    const animate = () => {
      ctx.fillStyle = '#0F172A'; // Dark slate background clearing
      ctx.fillRect(0, 0, width, height);
      
      // Rotate center slightly
      time += 0.005;
      centerX = width / 2 + Math.sin(time) * 50;
      centerY = height / 2 + Math.cos(time * 0.7) * 30;

      // Variable speed breathing
      speed = 5 + Math.sin(time * 0.5) * 3;

      stars.forEach(star => {
        star.update(speed);
        star.draw();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full opacity-100 z-0"
    />
  );
};
