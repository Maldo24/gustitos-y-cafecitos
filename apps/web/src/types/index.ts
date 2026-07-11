export interface User {
  _id: string;
  username: string;
  email: string;
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
  votes: number;
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