package com.example.smartdictionary;

public class TranslateResponse {
    private String translated;

    public TranslateResponse (String translated) {
        this.translated = translated;
    }

    public String getTranslated(){
        return translated;
    }

}