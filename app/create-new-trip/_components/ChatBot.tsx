"use client"
import axios from 'axios';
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import React, { useState, useRef, useEffect } from 'react'

type Message = {
    role: "user" | "assistant"
    content: string
}

const ChatBot = () => {
    const [messages, setmessages] = useState<Message[]>([])
    const [userInput, setuserInput] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto scroll to bottom when new messages are added
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Auto-focus textarea on component mount
    useEffect(() => {
        textareaRef.current?.focus()
    }, [])

    const onSend = async () => {
        if (!userInput?.trim() || isLoading) return;
        
        const inputValue = userInput
        setuserInput('')
        setIsLoading(true)
        
        const newmsg: Message = {
            role: 'user',
            content: inputValue
        }
        
        setmessages((prev: Message[]) => [...prev, newmsg])

        try {
            const result = await axios.post('/api/aimodel', {
                messages: [...messages, newmsg]
            })
            
            setmessages((prev: Message[]) => [...prev, {
                role: 'assistant',
                content: result?.data?.resp
            }])
            
        } catch (error) {
            console.error('Error sending message:', error)
            setmessages((prev: Message[]) => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }])
        } finally {
            setIsLoading(false)
            // Auto-focus back to textarea after response is received
            setTimeout(() => {
                textareaRef.current?.focus()
            }, 100)
        }
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            onSend()
        }
    }

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setuserInput(event.target.value)
    }

    return (
        <div className='h-[87vh] flex flex-col'>
            <section className='flex-1 overflow-y-auto p-4'>
                {messages.map((msg: Message, index) => (
                    msg.role === 'user' ?
                        <div className='flex justify-end mt-2' key={index}>
                            <div className='max-w-lg bg-primary text-white px-4 py-2 rounded-lg'>
                                {msg.content}
                            </div>
                        </div> :
                        <div className='flex justify-start mt-2' key={index}>
                            <div className='max-w-lg bg-gray-100 text-black px-4 py-2 rounded-lg'>
                                {msg.content}
                            </div>
                        </div>
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                    <div className='flex justify-start mt-2'>
                        <div className='max-w-lg bg-gray-100 text-black px-4 py-2 rounded-lg'>
                            <div className='flex items-center space-x-2'>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce'></div>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.1s'}}></div>
                                <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{animationDelay: '0.2s'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
            </section>
            
            <section>
                <div className='border rounded-2xl p-4 relative'>
                    <Textarea
                        ref={textareaRef}
                        className='w-full h-28 bg-transparent border-none resize-none focus-visible:ring-0' 
                        placeholder='Create Your Trip '
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        value={userInput}
                        disabled={isLoading}
                    />
                    <Button
                        size={'icon'} 
                        aria-label='Send trip request' 
                        className='absolute bottom-6 right-6'
                        onClick={onSend}
                        disabled={!userInput?.trim() || isLoading}
                    >
                        <Send className='h-4 w-4' />
                    </Button>
                </div>
            </section>
        </div>
    )
}

export default ChatBot
