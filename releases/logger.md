---
# Written by tools/sync-apps.mjs from the GitHub Release. Edit it if you like; the next
# release replaces it.
version: '1.3.0'
date: 2026-10-21
url: https://github.com/itsdoubleem/Logger_app/releases/tag/v1.3.0
---

급여기간 첫날 아침, 근무기록과 급여는 이제 방금 끝낸 근무가 있는 기간으로 열립니다. 20일 밤에 출근해 21일 아침에 퇴근한 야간 근무는 출근한 날(지난 급여기간)의 것인데, 예전에는 근무기록이 오늘 시작한 빈 기간으로 열려 0.0h를 보여 주었고 그 근무가 사라진 것처럼 읽혔습니다.

이번 기간이 아직 비어 있으면 기록이 있는 가장 가까운 기간이 열리고, 이번 기간에 첫 근무가 생기면 예전처럼 이번 기간입니다. 근무중인 근무도 기록으로 칩니다. 미리 적어 둔 연차나 특근은 이번 기간을 '채우지' 않습니다. 근무기록 ↔ 급여 사이를 오갈 때나 직접 고른 기간은 그대로 둡니다. 머리말의 기간 칩은 언제나 오늘의 기간입니다. 임금 계산은 바뀌지 않았습니다.
