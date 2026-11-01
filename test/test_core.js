import { extractTikTokVideo } from '../lib/tiktok-extractor.js';
import {
  validateVideo,
  checkHashtag,
  checkMention,
  checkKeyword,
  calculateER,
  DEFAULT_CAMPAIGN_CONFIG
} from '../lib/validator.js';

async function runTests() {
  console.log('========================================================');
  console.log('TIKTOK AFFILIATE VALIDATOR - CORE FUNCTION TEST SUITE');
  console.log('========================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // --- UNIT TESTS: STRING & REGEX MATCHING ---
  console.log('1. UNIT TESTS: CASE-INSENSITIVE & WORD BOUNDARY');

  const testCaption = 'Lagi review produk anti nyamuk nih gaes @vape.antinyamuk.idn ! Mantep banget pake #VapeCuanAntiNyamuk dan #vapemat serta #TanpaAsapTanpaAbu . Merk Vape Fumakilla emang top!';

  assert(checkMention(testCaption, '@vape.antinyamuk.idn'), 'Exact mention detected');
  assert(checkMention(testCaption, '@VAPE.ANTINYAMUK.IDN'), 'Mention case-insensitive uppercase');
  assert(!checkMention(testCaption, '@vape.antinyamuk'), 'Partial mention rejected correctly');

  assert(checkHashtag(testCaption, '#VapeCuanAntiNyamuk'), 'Hashtag matched');
  assert(checkHashtag(testCaption, '#vapemat'), 'Hashtag case-insensitive lowercase matched');
  assert(checkHashtag(testCaption, '#VAPEMAT'), 'Hashtag case-insensitive uppercase matched');
  assert(!checkHashtag(testCaption, '#Vape'), 'Partial hashtag #Vape does NOT falsely match #VapeCuanAntiNyamuk or #vapemat');

  assert(checkKeyword(testCaption, 'Vape'), 'Brand Vape detected');
  assert(checkKeyword(testCaption, 'FUMAKILLA'), 'Brand Fumakilla case-insensitive matched');
  assert(!checkKeyword(testCaption, 'Hit'), 'Non-existent brand rejected');

  // --- UNIT TESTS: ENGAGEMENT RATE (ER) ---
  console.log('\n2. UNIT TESTS: ENGAGEMENT RATE CALCULATION');

  const statsWithSaves = { views: 10000, likes: 500, comments: 50, shares: 30, saves: 20 };
  const er1 = calculateER(statsWithSaves);
  // (500 + 50 + 30 + 20) / 10000 * 100% = 600 / 10000 = 6.00%
  assert(er1.rate === 6.0, `ER with saves calculated correctly: ${er1.formatted} (Expected 6.00%)`);
  assert(er1.hasSaves === true, 'Flagged hasSaves as true');

  const statsWithoutSaves = { views: 5000, likes: 200, comments: 30, shares: 20, saves: null };
  const er2 = calculateER(statsWithoutSaves);
  // (200 + 30 + 20) / 5000 * 100% = 250 / 5000 = 5.00%
  assert(er2.rate === 5.0, `ER without saves calculated correctly: ${er2.formatted} (Expected 5.00%)`);
  assert(er2.hasSaves === false, 'Flagged hasSaves as false without faking 0');

  const zeroViews = { views: 0, likes: 10, comments: 2, shares: 1 };
  const erZero = calculateER(zeroViews);
  assert(erZero.rate === 0, 'Zero views handled without Division by Zero error');

  // --- INTEGRATION TEST: REAL TIKTOK LIVE DATA EXTRACTION ---
  console.log('\n3. INTEGRATION TEST: LIVE TIKTOK VIDEO EXTRACTION');
  const realUrl = 'https://www.tiktok.com/@scout2015/video/6718335390845095173';
  console.log(`Extracting real TikTok video: ${realUrl}`);

  const extractStart = Date.now();
  const extracted = await extractTikTokVideo(realUrl);
  const elapsed = Date.now() - extractStart;

  assert(extracted.success === true, `Extracted live TikTok video successfully in ${elapsed}ms`);
  assert(Boolean(extracted.videoId), `Video ID: ${extracted.videoId}`);
  assert(Boolean(extracted.author.username), `Username: @${extracted.author.username}`);
  assert(typeof extracted.author.followerCount === 'number', `Follower Count: ${extracted.author.followerCount}`);
  assert(typeof extracted.stats.views === 'number', `Views Count: ${extracted.stats.views}`);
  assert(typeof extracted.stats.likes === 'number', `Likes Count: ${extracted.stats.likes}`);
  assert(Boolean(extracted.caption), `Caption preview: "${extracted.caption.substring(0, 50)}..."`);
  assert(Boolean(extracted.media.videoUrl), `Stream URL extracted: ${extracted.media.videoUrl.substring(0, 60)}...`);

  // --- VALIDATION SCENARIO 1: Custom Campaign against Real Video ---
  console.log('\n4. VALIDATION SCENARIO 1: Real Video against Test Campaign');
  const testCampaign = {
    name: 'Pet Campaign',
    minFollowers: 1000,
    minViews: 500,
    minLikes: 100,
    requiredMentions: [],
    requiredHashtags: ['#foryoupage', '#petsoftiktok'],
    brandKeywords: ['guess'],
    brandCheckLocation: 'caption_or_video',
    expectedUsernames: ['scout2015'],
  };

  const validationResult = validateVideo(extracted, testCampaign);
  assert(validationResult.overallStatus === 'PASS', `Overall status is PASS (all requirements met)`);
  assert(validationResult.summary.fail === 0, `0 failed checks`);
  assert(validationResult.summary.pass >= 6, `Passed at least 6 criteria`);

  console.log('\nValidation Result Summary:');
  console.log(`- Username: ${validationResult.author.username}`);
  console.log(`- Followers: ${validationResult.author.followerCount} (Expected: > 1000)`);
  console.log(`- Views: ${validationResult.stats.views} (Expected: >= 500)`);
  console.log(`- Likes: ${validationResult.stats.likes} (Expected: >= 100)`);
  console.log(`- ER: ${validationResult.engagementRate.formatted} (${validationResult.engagementRate.explanation})`);
  console.log(`- Overall Status: ${validationResult.overallStatus}`);

  // --- VALIDATION SCENARIO 2: Failing Requirements ---
  console.log('\n5. VALIDATION SCENARIO 2: Detecting Missing Requirements (FAIL)');
  const failingCampaign = {
    name: 'Failing Test',
    minFollowers: 999999999, // Too high
    minViews: 300,
    minLikes: 50,
    requiredMentions: ['@vape.antinyamuk.idn'], // Not present
    requiredHashtags: ['#VapeCuanAntiNyamuk'], // Not present
    brandKeywords: ['Fumakilla'],
    brandCheckLocation: 'caption_only',
  };

  const failResult = validateVideo(extracted, failingCampaign);
  assert(failResult.overallStatus === 'FAIL', 'Overall status correctly marked as FAIL');
  assert(failResult.summary.fail >= 3, `Correctly identified multiple failing criteria (${failResult.summary.fail} failures)`);

  // --- SCENARIO 3: Invalid / Broken Link ---
  console.log('\n6. SCENARIO 3: Handling Broken / Invalid Link');
  const brokenResult = await extractTikTokVideo('https://www.tiktok.com/@nonexistent_user_xyz123/video/9999999999999999999');
  assert(brokenResult.success === false, 'Invalid video gracefully returned success: false without crashing');
  assert(Boolean(brokenResult.error), `Error message provided: "${brokenResult.error}"`);

  console.log('\n========================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================');
}

runTests().catch(console.error);
