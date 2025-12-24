type User = {
  id: string
  username: string
  avatar_url: string
  goal: 'reduce' | 'track' | 'sober' | 'explore'
  birthday: string
  is_legal_age: boolean
  timezone: string
  created_at: string
  updated_at: string
}

type UserSetting = {
  id: string
  user_id: string
  is_notification_allowed: boolean
  is_sound_allowed: boolean
}

type Badge = {
  id: string
  type: string
  target: string
}

type Notification = {
  id: string
  from_user: string
  to_user: string
  context: string
  created_at: string
  is_read: boolean
}

type DailyCheckIn = {
  id: string
  user_id: string
  date: Date
  status: 'no_alcohol' | 'drank' | 'planned_but_didnt' | 'craving' | 'skipped'
  mood: number
  notes: string
  created_at: string
}

type DrinkSession = {
  id: string
  user_id: string
}

type Drink = {
  id: string
  type: string
  amount: number
  alcohol_percentage: number
  image_url: string
}

type Goal = {
  id: string
}
