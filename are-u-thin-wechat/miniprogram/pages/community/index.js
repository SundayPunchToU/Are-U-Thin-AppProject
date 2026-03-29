/**
 * Community Page — 社区排行榜
 * 仅保留排行榜功能，支持点赞交互
 */

const store = require("../../utils/store");
const layout = require("../../utils/layout");

// ── Constants ──────────────────────────────────────

const DEMO_RANK_LIST = [
  { rank: 1, name: "小丽", avatar: "👩", streakDays: 21, todayCalories: 1420, targetCalories: 1600, isMe: false, likes: 12, liked: false },
  { rank: 2, name: "王同学", avatar: "🧑", streakDays: 18, todayCalories: 1580, targetCalories: 1600, isMe: false, likes: 8, liked: true },
  { rank: 3, name: "Alex", avatar: "👦", streakDays: 14, todayCalories: 1350, targetCalories: 1800, isMe: false, likes: 5, liked: false },
  { rank: 4, name: "我", avatar: "🙋", streakDays: 12, todayCalories: 1520, targetCalories: 1600, isMe: true, likes: 3, liked: false },
  { rank: 5, name: "小明", avatar: "👨", streakDays: 9, todayCalories: 1720, targetCalories: 1500, isMe: false, likes: 6, liked: false },
  { rank: 6, name: "小红", avatar: "👧", streakDays: 7, todayCalories: 0, targetCalories: 1500, isMe: false, likes: 2, liked: false },
  { rank: 7, name: "小李", avatar: "🧒", streakDays: 5, todayCalories: 1680, targetCalories: 1700, isMe: false, likes: 1, liked: false },
];

const RANK_PERIODS = [
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
];

// ── Page ───────────────────────────────────────────

Page({
  data: {
    rankList: [],
    rankPeriod: "week",
    rankPeriods: RANK_PERIODS,
    pageTopInset: layout.getPageTopInset(),
  },

  // ── Lifecycle ────────────────────────────────────

  async onShow() {
    const tabBar = this.getTabBar && this.getTabBar();
    if (tabBar) tabBar.setData({ selected: 2 });

    const access = await store.ensurePageAccess();
    if (access.redirectTo) {
      const method = access.redirectTo === "/pages/index/index" ? "reLaunch" : "redirectTo";
      wx[method]({ url: access.redirectTo });
      return;
    }

    this.loadDemoData();
  },

  // ── Data ─────────────────────────────────────────

  loadDemoData() {
    this.setData({
      rankList: JSON.parse(JSON.stringify(DEMO_RANK_LIST)),
    });
  },

  // ── Actions ──────────────────────────────────────

  switchRankPeriod(e) {
    const period = e.currentTarget.dataset.value;
    if (period === this.data.rankPeriod) return;
    this.setData({ rankPeriod: period });
  },

  toggleLike(e) {
    const rank = e.currentTarget.dataset.rank;
    const key = `rankList[${rank - 1}]`;
    const item = this.data.rankList[rank - 1];
    if (!item) return;

    const liked = !item.liked;
    const likes = liked ? item.likes + 1 : item.likes - 1;
    this.setData({
      [`${key}.liked`]: liked,
      [`${key}.likes`]: likes,
    });
  },
});
