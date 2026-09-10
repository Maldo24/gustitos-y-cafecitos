export interface User {
  _id: string;
  username: string;
  email: string;
  names: string,
  firtsSurname: string,
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
}

export interface MemberReview {
  userId: string | User;
  username: string;
  comment: string;
  createdAt: string;
}

export interface Restaurant {
  _id: string;
  groupId: string;
  name: string;
  mapsLink: string;
  categoryId: string | Category;
  memberReviews: MemberReview[];
  votes: string[];
  votesCount?: number;
  createdAt: string;
}

export interface Group {
  _id: string;
  slug: string;
  name: string;
  members: string[] | User[];
  savedRestaurants: string[] | Restaurant[];
  createdAt: string;
}

export interface ItemConsumed {
  dishName: string;
  price: number;
  quantity: number;
}

export interface SessionParticipant {
  _id?: string;
  name: string;
  userId?: string;
  itemsConsumed: ItemConsumed[];
  finalPay: number;
  isPaid: boolean;
}

export interface Session {
  _id: string;
  groupId?: string;
  title: string;
  totalAmount: number;
  tipPercentage: number;
  splitMode: 'equal' | 'by_consumption';
  participants: SessionParticipant[];
  createdAt: string;
}