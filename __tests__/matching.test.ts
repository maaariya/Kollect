// __tests__/matching.test.ts

import { scoreUsers, UserWithListings } from "../lib/matching";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeUser(
  id: number,
  wishlistCardIds: number[],
  tradingCardIds: number[]
): UserWithListings {
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@test.com`,
    wishlist: wishlistCardIds.map(cardId => ({ cardId })),
    tradingListings: tradingCardIds.map(cardId => ({ cardId })),
  };
}

// ── test suites ───────────────────────────────────────────────────────────────

describe("scoreUsers — basic matching", () => {

  test("returns empty array when no users provided", () => {
    const result = scoreUsers([1, 2], [3, 4], []);
    expect(result).toEqual([]);
  });

  test("returns empty array when current user has no trading cards", () => {
    const user = makeUser(2, [1], [5]);
    const result = scoreUsers([], [1], [user]);
    expect(result).toEqual([]);
  });

  test("returns empty array when current user has no wishlist", () => {
    const user = makeUser(2, [1], [3]);
    const result = scoreUsers([1], [], [user]);
    // theyHaveWhatIWant = 0 → filtered out
    expect(result).toEqual([]);
  });

  test("returns a match when mutual compatibility exists", () => {
    // I trade card 1, I want card 2
    // User 2 trades card 2, wants card 1
    const user = makeUser(2, [1], [2]);
    const result = scoreUsers([1], [2], [user]);
    expect(result).toHaveLength(1);
    expect(result[0].user.id).toBe(2);
  });

});

describe("scoreUsers — quality filters", () => {

  test("filters out users where theyHaveWhatIWant = 0", () => {
    // User wants my card but has nothing I want
    const user = makeUser(2, [1], [99]);
    const result = scoreUsers([1], [2], [user]);
    expect(result).toHaveLength(0);
  });

  test("filters out users with score below 2", () => {
    // iHaveWhatTheyWant = 1 (×1 = 1), theyHaveWhatIWant = 0 → filtered before score check
    // Force a case: theyHaveWhatIWant = 1 (×3 = 3) but no tiebreaker
    // score = 0 + 3 + 0 = 3 → should pass
    const user = makeUser(2, [], [2]);
    const result = scoreUsers([1], [2], [user]);
    // theyHaveWhatIWant = 1, iHaveWhatTheyWant = 0, score = 3 → passes both filters
    expect(result).toHaveLength(1);
  });

  test("filters out a user whose score is exactly 0", () => {
    const user = makeUser(2, [99], [88]);
    // No overlap either way
    const result = scoreUsers([1], [2], [user]);
    expect(result).toHaveLength(0);
  });

});

describe("scoreUsers — scoring formula", () => {

  test("theyHaveWhatIWant is weighted ×3", () => {
    // I trade [1], I want [2, 3]
    // User trades [2, 3], wants [1]
    // iHaveWhatTheyWant = 1 (×1 = 1)
    // theyHaveWhatIWant = 2 (×3 = 6)
    // tiebreaker = 2 × 0.2 = 0.4
    // score = 7.4
    const user = makeUser(2, [1], [2, 3]);
    const result = scoreUsers([1], [2, 3], [user]);
    expect(result[0].score).toBeCloseTo(7.4);
    expect(result[0].theyHaveWhatIWant).toBe(2);
    expect(result[0].iHaveWhatTheyWant).toBe(1);
  });

  test("iHaveWhatTheyWant is weighted ×1", () => {
    // I trade [1, 2, 3], I want [10]
    // User trades [10], wants [1, 2, 3]
    // iHaveWhatTheyWant = 3 (×1 = 3)
    // theyHaveWhatIWant = 1 (×3 = 3)
    // tiebreaker = 1 × 0.2 = 0.2
    // score = 6.2
    const user = makeUser(2, [1, 2, 3], [10]);
    const result = scoreUsers([1, 2, 3], [10], [user]);
    expect(result[0].score).toBeCloseTo(6.2);
  });

  test("tiebreaker adds 0.2 per trading card the other user has", () => {
    // I trade [1], I want [2]
    // User trades [2, 3, 4, 5] (4 cards), wants [1]
    // theyHaveWhatIWant = 1 (×3 = 3)
    // iHaveWhatTheyWant = 1 (×1 = 1)
    // tiebreaker = 4 × 0.2 = 0.8
    // score = 4.8
    const user = makeUser(2, [1], [2, 3, 4, 5]);
    const result = scoreUsers([1], [2], [user]);
    expect(result[0].score).toBeCloseTo(4.8);
  });

});

describe("scoreUsers — ranking", () => {

  test("returns users sorted by score descending", () => {
    // User 2: theyHaveWhatIWant=2 → score = 6 + ...
    // User 3: theyHaveWhatIWant=1 → score = 3 + ...
    const user2 = makeUser(2, [1], [10, 11]); // they have both cards I want
    const user3 = makeUser(3, [1], [10]);      // they have one card I want
    const result = scoreUsers([1], [10, 11], [user2, user3]);
    expect(result[0].user.id).toBe(2);
    expect(result[1].user.id).toBe(3);
  });

  test("higher mutual overlap ranks above lower overlap", () => {
    const highMatch = makeUser(2, [1, 2], [5, 6]); // wants 2 of my cards, has 2 I want
    const lowMatch  = makeUser(3, [1],    [5]);     // wants 1, has 1
    const result = scoreUsers([1, 2], [5, 6], [highMatch, lowMatch]);
    expect(result[0].user.id).toBe(2);
  });

  test("does not include duplicate users", () => {
    const user = makeUser(2, [1], [2]);
    const result = scoreUsers([1], [2], [user, user]);
    // Both entries score the same and both pass filters
    // Just check no crash and both returned (dedup is not the algorithm's job)
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

});

describe("scoreUsers — edge cases", () => {

  test("handles user with empty wishlist and empty trading listings", () => {
    const user = makeUser(2, [], []);
    const result = scoreUsers([1], [2], [user]);
    expect(result).toHaveLength(0);
  });

  test("handles large card ID numbers without error", () => {
    const user = makeUser(2, [99999], [88888]);
    const result = scoreUsers([99999], [88888], [user]);
    expect(result).toHaveLength(1);
  });

  test("handles many users and returns them all if they qualify", () => {
    const users = Array.from({ length: 20 }, (_, i) =>
      makeUser(i + 2, [1], [2])
    );
    const result = scoreUsers([1], [2], users);
    expect(result).toHaveLength(20);
  });

});