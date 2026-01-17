"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { getRecruitmentEvents } from "@/lib/db/events"
import { submitQuizResult } from "@/lib/db/registrations"
import type { RecruitmentEvent, QuizQuestion } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/context/auth-context"

export default function StudentQuizPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <QuizContent />
        </Suspense>
    )
}

function QuizContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<RecruitmentEvent | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)

  useEffect(() => {
    if (id) {
      loadEvent()
    }
  }, [id])

  const loadEvent = async () => {
    // In a real app we might have getEventById
    // For now we can find safely or implement getEventById in lib
    // Let's rely on getRecruitmentEvents and find match for simplicity
    // or better, actually use getEventById if it exists?
    // Looking at file lib/db/events.ts, it likely has getEvents, creates...
    // Let's assume fetching all and finding is fine for prototype or better create getEventById
    
    // Actually, let's just fetch all.
    const allEvents = await getRecruitmentEvents()
    const found = allEvents.find(e => e.id === id)
    if (found) {
        setEvent(found)
    }
  }

  const handleOptionChange = (questionId: string, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex
    })
  }

  const handleSubmit = async () => {
    if (!event?.quiz || !user) return
    
    let calculatedScore = 0
    event.quiz.questions.forEach(q => {
        const userAnswer = answers[q.id]
        if (userAnswer === q.correctOptionIndex) {
            calculatedScore += (q.marks || 0)
        }
    })
    setScore(calculatedScore)
    setSubmitted(true)
    
    try {
        await submitQuizResult(event.id, user.id, calculatedScore)
    } catch (error) {
        console.error("Failed to save quiz result", error)
        // Optionally show toast/alert
    }
  }

  if (!event) return <div className="p-8">Loading or Event Not Found...</div>

  if (!event.quiz || event.quiz.questions.length === 0) {
      return (
          <div className="container mx-auto py-8">
              <Card>
                  <CardContent className="pt-6">
                      <p>No quiz available for this event.</p>
                      <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Quiz: {event.quiz.title || event.title}</CardTitle>
          <p className="text-muted-foreground">Total Questions: {event.quiz.questions.length} | Total Marks: {event.quiz.totalMarks}</p>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <div className="space-y-8">
              {event.quiz.questions.map((q, index) => (
                <div key={q.id} className="space-y-4">
                  <div className="font-medium text-lg">
                    {index + 1}. {q.question}
                    <span className="text-sm text-muted-foreground ml-2">({q.marks} marks)</span>
                  </div>
                  <RadioGroup 
                    value={answers[q.id]?.toString()} 
                    onValueChange={(val) => handleOptionChange(q.id, parseInt(val))}
                  >
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={oIndex.toString()} id={`q-${q.id}-opt-${oIndex}`} />
                        <Label htmlFor={`q-${q.id}-opt-${oIndex}`}>{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              ))}
              
              <div className="pt-4 flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button onClick={handleSubmit}>Submit Quiz</Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6 py-8">
              <h2 className="text-3xl font-bold">Quiz Completed!</h2>
              <div className="text-xl">
                Your Score: <span className="font-bold text-primary">{score}</span> / {event.quiz.totalMarks}
              </div>
              
              <div className="space-y-4 text-left max-w-xl mx-auto border-t pt-8 mt-8">
                  <h3 className="font-bold text-lg">Detailed Results:</h3>
                  {event.quiz.questions.map((q, index) => {
                      const isCorrect = answers[q.id] === q.correctOptionIndex
                      return (
                          <div key={q.id} className={`p-4 rounded-md border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                              <p className="font-medium">{index + 1}. {q.question}</p>
                              <p className="text-sm mt-2">
                                  Your Answer: {q.options[answers[q.id] || 0]} 
                                  {isCorrect ? <span className="text-green-600 font-bold ml-2">✓ Correct</span> : <span className="text-red-600 font-bold ml-2">✗ Incorrect</span>}
                              </p>
                              {!isCorrect && (
                                  <p className="text-sm text-green-700 mt-1">Correct Answer: {q.options[q.correctOptionIndex]}</p>
                              )}
                          </div>
                      )
                  })}
              </div>

              <div className="pt-8">
                  <Button onClick={() => router.back()}>Back to Dashboard</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
