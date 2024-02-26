module.exports = {
    isSteamRunning: () => true,
    init: () => true,
    getSteamId: () => ({
        screenName: '_',
        steamId: '00000000000000000'
    }),
    activateAchievement: (achievement, onSuccess, _onFail) => onSuccess(achievement),
    clearAchievement: (achievement, onSuccess, _onFail) => onSuccess(achievement),
    getAchievementNames: () => [],
    getCurrentGameLanguage: () => 'english'
};