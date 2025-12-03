package com.example.smartdictionary;

import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
public class TranslateController {

    @PostMapping("/translate")
    public Map<String, String> translate(@RequestBody Map<String, String> body) {
        String text = body.get("text");

        // Mock translation tạm thời
        String translated = mockTranslate(text);

        Map<String, String> result = new HashMap<>();
        result.put("translated", translated);
        return result;
    }

    private String mockTranslate(String text) {
        if (text.equals("I love studying computer science")) {
            return "Tôi thích học khoa học máy tính";
        }
        return "Tạm dịch: " + text;
    }
}