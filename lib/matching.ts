// lib/matching.ts

export type UserWithListings = {
  id: number;
  name: string;
  email: string;
  wishlist: { cardId: number }[];
  tradingListings: { cardId: number }[];
};

export type ScoredUser = {
  user: UserWithListings;
  score: number;
  iHaveWhatTheyWant: number;
  theyHaveWhatIWant: number;
};

export function scoreUsers(
  tradingCardIds: number[],
  myWishlistIds: number[],
  users: UserWithListings[]
): ScoredUser[] {
  return users
    .map(user => {
      const theirWishlistIds = user.wishlist.map(w => w.cardId);
      const theirTradingIds = user.tradingListings.map(t => t.cardId);

      const iHaveWhatTheyWant = theirWishlistIds.filter(id =>
        tradingCardIds.includes(id)
      ).length;

      const theyHaveWhatIWant = theirTradingIds.filter(id =>
        myWishlistIds.includes(id)
      ).length;

      const score =
        (iHaveWhatTheyWant * 1) +
        (theyHaveWhatIWant * 3) +
        (theirTradingIds.length * 0.2);

      return { user, score, iHaveWhatTheyWant, theyHaveWhatIWant };
    })
    .filter(u => u.theyHaveWhatIWant > 0)
    .filter(u => u.score >= 2)
    .sort((a, b) => b.score - a.score);
}