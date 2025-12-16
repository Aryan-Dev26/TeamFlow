'use client'

import React, { useState, useEffect } from 'react'

interface TeamFlowLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function TeamFlowLogo({ 
  size = 'md', 
  showText = true, 
  className = '' 
}: TeamFlowLogoProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [particles, setParticles] = useState<any[]>([])
  const [rotation, setRotation] = useState(0)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32',
    xl: 'w-64 h-64 md:w-80 md:h-80'
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360)
    }, 30)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isHovered) {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        angle: (i * 45) + Math.random() * 10,
        distance: Math.random() * 50 + 50,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 2 + 1
      }))
      setParticles(newParticles)
      setTimeout(() => setParticles([]), 2000)
    }
  }, [isHovered])

  const nodes = [
    { x: 120, y: 140, delay: 0 },
    { x: 280, y: 140, delay: 0.5 },
    { x: 120, y: 260, delay: 1 },
    { x: 280, y: 260, delay: 1.5 }
  ]

  return (
    <div 
      className={`flex flex-col items-center justify-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 400 400" 
        className={`${sizeClasses[size]} transition-transform duration-300`}
        style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
      >
        <defs>
          <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="pulseGradient">
            <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#6366f1', stopOpacity: 0.2 }} />
          </radialGradient>
        </defs>

        {/* Animated background circles */}
        <circle cx="200" cy="200" r="190" fill="#6366f1" opacity="0.05">
          <animate attributeName="r" values="190;200;190" dur="3s" repeatCount="indefinite"/>
        </circle>
        <circle cx="200" cy="200" r="150" fill="#8b5cf6" opacity="0.05">
          <animate attributeName="r" values="150;160;150" dur="2.5s" repeatCount="indefinite"/>
        </circle>

        {/* Connection lines with pulse */}
        {nodes.map((node, index) => (
          <line
            key={`line-${index}`}
            x1="200"
            y1="200"
            x2={node.x}
            y2={node.y}
            stroke="url(#nodeGradient)"
            strokeWidth={isHovered ? "10" : "8"}
            strokeLinecap="round"
            opacity="0.6"
            filter="url(#glow)"
            className="transition-all duration-300"
          >
            <animate 
              attributeName="opacity" 
              values="0.3;0.8;0.3" 
              dur="2s" 
              begin={`${node.delay}s`}
              repeatCount="indefinite"
            />
          </line>
        ))}

        {/* Flowing particles */}
        {nodes.map((node, index) => (
          <circle key={`particle-${index}`} r="5" fill="#6366f1" opacity="0.8">
            <animateMotion dur="2s" begin={`${node.delay}s`} repeatCount="indefinite">
              <mpath href={`#path${index}`}/>
            </animateMotion>
            <animate 
              attributeName="opacity" 
              values="0;1;0" 
              dur="2s" 
              begin={`${node.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {nodes.map((node, index) => (
          <path 
            key={`path${index}`}
            id={`path${index}`}
            d={`M 200,200 L ${node.x},${node.y}`} 
            fill="none" 
            stroke="none"
          />
        ))}

        {/* Team member nodes with bounce */}
        {nodes.map((node, index) => (
          <g key={`node-${index}`}>
            <circle
              cx={node.x}
              cy={node.y}
              r={isHovered ? "26" : "22"}
              fill="url(#nodeGradient)"
              filter="url(#glow)"
              className="transition-all duration-300"
            >
              <animate 
                attributeName="r" 
                values="22;26;22" 
                dur="2s" 
                begin={`${node.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill="white"
              opacity="0.5"
            >
              <animate 
                attributeName="opacity" 
                values="0.3;0.7;0.3" 
                dur="2s" 
                begin={`${node.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        ))}

        {/* Central hub with rotation */}
        <g>
          {/* Pulse rings */}
          <circle
            cx="200"
            cy="200"
            r="35"
            fill="url(#pulseGradient)"
            opacity="0.3"
          >
            <animate attributeName="r" values="35;55;35" dur="3s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
          </circle>

          {/* Rotating outer ring */}
          <circle
            cx="200"
            cy="200"
            r="40"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="5,5"
            opacity="0.5"
            style={{ 
              transform: `rotate(${rotation}deg)`, 
              transformOrigin: '200px 200px' 
            }}
          />

          {/* Main hub */}
          <circle
            cx="200"
            cy="200"
            r={isHovered ? "34" : "30"}
            fill="url(#nodeGradient)"
            filter="url(#glow)"
            className="transition-all duration-300"
          >
            <animate attributeName="r" values="30;34;30" dur="2s" repeatCount="indefinite"/>
          </circle>

          {/* Center highlight */}
          <circle
            cx="200"
            cy="200"
            r="12"
            fill="white"
            opacity="0.6"
          >
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        </g>

        {/* Sparkles */}
        {[
          { x: 160, y: 170, delay: 0.3 },
          { x: 240, y: 170, delay: 0.8 },
          { x: 160, y: 230, delay: 1.3 },
          { x: 240, y: 230, delay: 1.8 }
        ].map((sparkle, index) => (
          <circle
            key={`sparkle-${index}`}
            cx={sparkle.x}
            cy={sparkle.y}
            r="3"
            fill="#fbbf24"
            opacity="0"
          >
            <animate 
              attributeName="opacity" 
              values="0;1;0" 
              dur="1.5s" 
              begin={`${sparkle.delay}s`}
              repeatCount="indefinite"
            />
            <animate 
              attributeName="r" 
              values="2;4;2" 
              dur="1.5s" 
              begin={`${sparkle.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Hover particles */}
        {isHovered && particles.map(particle => {
          const x = 200 + Math.cos(particle.angle * Math.PI / 180) * particle.distance
          const y = 200 + Math.sin(particle.angle * Math.PI / 180) * particle.distance
          return (
            <circle
              key={particle.id}
              cx={x}
              cy={y}
              r={particle.size}
              fill="#fbbf24"
              opacity="0.8"
              style={{
                animation: `fadeOut ${particle.duration}s ease-out forwards`
              }}
            />
          )
        })}

        {/* Text */}
        {showText && size === 'xl' && (
          <>
            <text
              x="200"
              y="340"
              fontFamily="Arial, sans-serif"
              fontSize="48"
              fontWeight="bold"
              fill="url(#nodeGradient)"
              textAnchor="middle"
              filter="url(#glow)"
              className={isHovered ? 'animate-pulse' : ''}
            >
              TeamFlow
            </text>
            <text
              x="200"
              y="368"
              fontFamily="Arial, sans-serif"
              fontSize="14"
              fill="#8b5cf6"
              textAnchor="middle"
              opacity="0.7"
            >
              <tspan>
                Collaborate • Connect • Create
                <animate attributeName="opacity" values="0.5;0.9;0.5" dur="4s" repeatCount="indefinite"/>
              </tspan>
            </text>
          </>
        )}
      </svg>

      {/* Status indicator for large size */}
      {size === 'xl' && (
        <div className="mt-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isHovered ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></div>
          <span className="text-sm text-gray-600 font-medium">
            {isHovered ? '✨ Interactive' : '🔄 Live Collaboration'}
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeOut {
          to {
            opacity: 0;
            transform: scale(1.5);
          }
        }
      `}</style>
    </div>
  )
}