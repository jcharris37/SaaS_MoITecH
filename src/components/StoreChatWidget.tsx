import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { motion } from 'framer-motion';

interface StoreChatWidgetProps {
  slug: string;
}

interface Message {
  id: number;
  sender: 'user' | 'bot';
  text: string;
}

const StoreChatWidget: React.FC<StoreChatWidgetProps> = ({ slug }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, sender: 'bot', text: '¡Hola! Bienvenido. Soy el asistente inteligente. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${API_URL}/api/store/${slug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      const data = await response.json();
      
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: data.reply || 'Sin respuesta del servidor' }]);
        setIsTyping(false);
        
        if (data.action === 'redirect_whatsapp' && data.phone) {
          // Abrir WhatsApp en una nueva pestaña después de mostrar el mensaje
          setTimeout(() => {
             const cleanPhone = data.phone.replace(/[^0-9]/g, '');
             const msg = encodeURIComponent("Hola, me comunico desde la tienda online.");
             window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
          }, 1000);
        }
      }, 800); // Simulamos retraso de tipeo

    } catch {
      setTimeout(() => {
        setMessages(prev => [...prev, { id: Date.now(), sender: 'bot', text: 'Hubo un error de conexión.' }]);
        setIsTyping(false);
      }, 500);
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-dark" style={{height: '400px'}}>
      <div className="p-3 d-flex align-items-center gap-3 border-bottom" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)'}}>
        <div className="text-white p-2 rounded-circle" style={{backgroundColor: 'var(--accent-color)'}}>
           <Bot size={24} />
        </div>
        <div>
          <h6 className="mb-0 fw-bold text-white">Asistente de la Tienda</h6>
          {isTyping ? (
            <small className="text-warning fw-medium d-flex align-items-center gap-1">Escribiendo...</small>
          ) : (
            <small className="text-success fw-medium">● En línea</small>
          )}
        </div>
      </div>

      <div className="flex-grow-1 p-3" style={{backgroundColor: 'var(--card-bg)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
        {messages.map((msg) => (
          <motion.div 
            key={msg.id} 
            initial={{opacity: 0, y: 10}} 
            animate={{opacity: 1, y: 0}}
            className={`d-flex flex-column ${msg.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}
          >
            <div 
              className="p-3 border shadow-sm position-relative text-main"
              style={{
                maxWidth: '85%', 
                borderTopRightRadius: msg.sender === 'user' ? '0' : '16px', 
                borderTopLeftRadius: msg.sender === 'bot' ? '0' : '16px', 
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px',
                backgroundColor: msg.sender === 'bot' ? 'rgba(255,255,255,0.05)' : 'var(--accent-color)',
                color: '#fff',
                borderColor: 'var(--border-color)'
              }}
            >
              <p className="mb-0" style={{fontSize: '0.9rem'}}>{msg.text}</p>
            </div>
          </motion.div>
        ))}
        {isTyping && (
           <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="d-flex flex-column align-items-start">
             <div className="p-3 shadow-sm rounded-4 rounded-top-0 d-flex gap-1 align-items-center" style={{backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)'}}>
               <span className="spinner-grow spinner-grow-sm text-secondary" style={{width:8, height:8}}></span>
               <span className="spinner-grow spinner-grow-sm text-secondary" style={{width:8, height:8, animationDelay: '0.2s'}}></span>
               <span className="spinner-grow spinner-grow-sm text-secondary" style={{width:8, height:8, animationDelay: '0.4s'}}></span>
             </div>
           </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-top" style={{borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)'}}>
        <form onSubmit={handleSend} className="input-group">
          <input 
            type="text" 
            className="form-control py-2 text-white" 
            placeholder="Escribe tu mensaje..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid var(--border-color)'}} 
          />
          <button type="submit" className="btn text-white px-3 d-flex align-items-center" style={{backgroundColor: 'var(--accent-color)', border: 'none'}}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default StoreChatWidget;
