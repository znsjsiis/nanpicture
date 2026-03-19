package com.zn.nanpicturebackend.common;

import lombok.Data;

@Data
public class PageRequest {

    private long current = 1;

    private long pageSize = 10;

    private String sortField;

    private String sortOrder = "asc";
}
