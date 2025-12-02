package com.example.smartdictionary;

import java.util.Set;

public class Levenshtein {

    public static int calculate(String x, String y) {
        int[][] dp = new int[x.length() + 1][y.length() + 1];

        for (int i = 0; i <= x.length(); i++) {
            for (int j = 0; j <= y.length(); j++) {
                if (i == 0) {
                    dp[i][j] = j;
                } else if (j == 0) {
                    dp[i][j] = i;
                } else {
                    dp[i][j] = min(
                        dp[i - 1][j - 1] + (x.charAt(i - 1) == y.charAt(j - 1) ? 0 : 1), // cost
                        dp[i - 1][j] + 1, // deletion
                        dp[i][j - 1] + 1  // insertion
                    );
                }
            }
        }
        return dp[x.length()][y.length()];
    }

    private static int min(int a, int b, int c) {
        return Math.min(Math.min(a, b), c);
    }

    public static String findClosest(String word, Set<String> dictionaryKeys) {
        String bestWord = null;
        int minDist = Integer.MAX_VALUE;

        for (String w : dictionaryKeys) {
            int dist = calculate(word, w);
            if (dist < minDist) {
                minDist = dist;
                bestWord = w;
            }
        }
        // Only return if reasonably close (threshold of 2)
        return minDist <= 2 ? bestWord : null;
    }
}