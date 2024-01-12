/*!
 * This source file is part of the EdgeDB open source project.
 *
 * Copyright 2019-present MagicStack Inc. and the EdgeDB authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ReadBuffer, WriteBuffer } from "../primitives/buffer";
import { ICodec, ScalarCodec } from "./ifaces";
import { LocalDateTime, LocalDate, LocalTime, Duration, RelativeDuration, DateDuration } from "../datatypes/datetime";
export declare class DateTimeCodec extends ScalarCodec implements ICodec {
    tsType: string;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): Date;
}
export declare class LocalDateTimeCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): LocalDateTime;
}
export declare class LocalDateCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): LocalDate;
}
export declare class LocalTimeCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): LocalTime;
}
export declare function checkValidEdgeDBDuration(duration: Duration): null | string;
export declare class DurationCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): Duration;
}
export declare class RelativeDurationCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): RelativeDuration;
}
export declare class DateDurationCodec extends ScalarCodec implements ICodec {
    tsType: string;
    importedType: boolean;
    encode(buf: WriteBuffer, object: unknown): void;
    decode(buf: ReadBuffer): DateDuration;
}
