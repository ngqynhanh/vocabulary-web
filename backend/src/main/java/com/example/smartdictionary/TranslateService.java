package com.example.smartdictionary;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class TranslateService {

    private static final String API_URL = "https://libretranslate.com/translate";
    private final HttpClient client;

    public TranslateService() {
        this.client = HttpClient.newHttpClient();
    }

    /**
     * Translates a sentence using LibreTranslate API.
     *
     * @param text       The text to translate
     * @param sourceLang e.g., "en"
     * @param targetLang e.g., "vi"
     * @return translated text or null if failed
     */
    public String translate(String text, String sourceLang, String targetLang) {
        // Validate inputs
        if (text == null || text.isBlank()) {
            return null;
        }
        if (sourceLang == null || sourceLang.isBlank()) {
            sourceLang = "en";
        }
        if (targetLang == null || targetLang.isBlank()) {
            targetLang = "vi";
        }
        
        try {
            String json = String.format(
                "{\"q\":\"%s\", \"source\":\"%s\", \"target\":\"%s\", \"format\":\"text\"}",
                escapeJson(text), sourceLang, targetLang
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(API_URL))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            // Response example:
            // {"translatedText":"Xin chào bạn"}
            if (response.statusCode() == 200) {
                String translated = extractTranslatedText(response.body());
                if (translated != null && !translated.isEmpty()) {
                    return translated;
                }
            } else {
                System.err.println("Translation API returned status: " + response.statusCode());
                if (response.body() != null) {
                    System.err.println("Response body: " + response.body());
                }
            }

        } catch (Exception e) {
            System.err.println("Translation error: " + e.getMessage());
            e.printStackTrace();
        }
        return null;
    }

    /** Extract "translatedText" from JSON manually (no libraries needed) */
    private String extractTranslatedText(String json) {
        if (json == null || json.isEmpty()) return null;
        
        // Look for "translatedText":" pattern
        String pattern = "\"translatedText\":\"";
        int startIdx = json.indexOf(pattern);
        if (startIdx == -1) return null;
        
        startIdx += pattern.length();
        
        // Find the closing quote, handling escaped quotes
        int endIdx = startIdx;
        while (endIdx < json.length()) {
            if (json.charAt(endIdx) == '"' && (endIdx == startIdx || json.charAt(endIdx - 1) != '\\')) {
                break;
            }
            endIdx++;
        }
        
        if (endIdx > startIdx && endIdx < json.length()) {
            String extracted = json.substring(startIdx, endIdx);
            // Unescape JSON string
            return extracted.replace("\\\"", "\"")
                           .replace("\\\\", "\\")
                           .replace("\\n", "\n")
                           .replace("\\r", "\r")
                           .replace("\\t", "\t");
        }
        return null;
    }

    /** Escape special characters for JSON string */
    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")  // Backslash first
                   .replace("\"", "\\\"")  // Quotes
                   .replace("\n", "\\n")   // Newlines
                   .replace("\r", "\\r")   // Carriage returns
                   .replace("\t", "\\t")   // Tabs
                   .replace("\b", "\\b")   // Backspace
                   .replace("\f", "\\f");  // Form feed
    }
}
