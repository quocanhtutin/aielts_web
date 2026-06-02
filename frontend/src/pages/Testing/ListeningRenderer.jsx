import React, { useState, useEffect, useRef } from "react";
import "./ListeningRenderer.css";
import { ScrollText } from 'lucide-react'

const Instruction = ({ questionRange, title, note }) => {
  return (
    <div className="ls-instruction">
      <div className="ls-q-range">{questionRange}</div>
      <div className="ls-title">{title}</div>
      <div className="ls-note">{note}</div>
    </div>
  );
};

const NoteBlock = ({ block, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  return (
    <div className="ls-note-block">
      <h3>{block.heading}</h3>

      {block.items.map((item, i) => (
        <div key={i} className="ls-line">
          {item.content.map((c, idx) => {
            if (typeof c === "string") return <span key={idx}>{c} </span>;

            if (typeof c === "object" && c.q) {
              const qid = c.q;
              const expected = (answerKeyMap && answerKeyMap[qid]) || "";
              const user = answers[qid] || "";
              const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
              const isCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

              return (
                <div key={idx} style={{ display: "inline", alignItems: 'center' }} id={`q-${c.q}`}>
                    <p className="ls_question_number">{c.q}.</p>
                    <input
                        key={idx}
                        className={`ls-input ${isSubmitted && expected !== "" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}
                        value={answers[c.q] || ""}
                        onChange={(e) => onChange(c.q, e.target.value)}
                    />
                    {isSubmitted && expected !== "" && !isCorrect && (
                      <span className="correct-answer">{expected}</span>
                    )}
                    {isSubmitted && onOpenScriptForQuestion && (
                      <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(qid)} title="Xem script">
                        <ScrollText size={16} />
                      </button>
                    )}
                </div>
              );
            }

            return null;
          })}
        </div>
      ))}
    </div>
  );
};

const TableBlock = ({ block, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  const renderCellContent = (cell, answers, onChange, onOpenScriptForQuestion) => {
        if (typeof cell === "string") return cell;

        if (Array.isArray(cell)) {
            return cell.map((c, i) => {
                if (typeof c === "string") return <span key={i}>{c} </span>;

                if (typeof c === "object" && c.q) {
                  const qid = c.q;
                  const expected = (answerKeyMap && answerKeyMap[qid]) || "";
                  const user = answers[qid] || "";
                  const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
                  const isCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

                  return (
                    <div key={i} style={{ display: "inline" }} id={`q-${c.q}`}>
                      <p className="ls_question_number">{c.q}.</p>
                      <input
                        key={i}
                        className={`ls-input ${isSubmitted && expected !== "" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}
                        value={answers[c.q] || ""}
                        onChange={(e) => onChange(c.q, e.target.value)}
                      />
                      {isSubmitted && expected !== "" && !isCorrect && (
                        <span className="correct-answer">{expected}</span>
                      )}
                      {isSubmitted && onOpenScriptForQuestion && (
                        <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(qid)} title="Xem script">
                          <ScrollText size={16} />
                        </button>
                      )}
                    </div>
                  );
                }

                return null;
            });
        }

          if (typeof cell === "object" && cell.q) {
          const qid = cell.q;
          const expected = (answerKeyMap && answerKeyMap[qid]) || "";
          const user = answers[qid] || "";
          const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
          const isCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

          return (
            <div style={{ display: "inline" }} id={`q-${cell.q}`}>
                  <p className="ls_question_number">{cell.q}.</p>
                  <input
                    className={`ls-input ${isSubmitted && expected !== "" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}
                    value={answers[cell.q] || ""}
                    onChange={(e) => onChange(cell.q, e.target.value)}
                  />
                  {isSubmitted && expected !== "" && !isCorrect && (
                    <span className="correct-answer">{expected}</span>
                  )}
                  {isSubmitted && onOpenScriptForQuestion && (
                    <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(qid)} title="Xem script">
                      <ScrollText size={16} />
                    </button>
                  )}
                </div>
          );
        }

        return null;
        };
  return (
    <div className="ls-table">
      <table>
        <thead>
          <tr>
            {block.headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {block.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => {return(
                <td key={j}>
                        {renderCellContent(cell, answers, onChange, onOpenScriptForQuestion)}
                </td>
              )
                })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MCQBlock = ({ block, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  return (
    <div className="ls-mcq">
      {block.questions.map((q) => {
        const isImageMode = q.options?.[0]?.type === "image";

        const expected = (answerKeyMap && answerKeyMap[q.q]) || "";
        const user = answers[q.q] || "";
        const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
        const userCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

        return (
          <div key={q.q} className="ls-mcq-item" id={`q-${q.q}`}>
            <div className="ls-question-title" style={{display:'flex', alignItems:'center', gap:8}}>
              <div >{q.q}. {q.question}</div>
              {isSubmitted && onOpenScriptForQuestion && (
                <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(q.q)} title="Xem script">
                  <ScrollText size={16} />
                </button>
              )}
            </div>

            <div
              className={`ls-options ${
                isImageMode ? "image-mode" : ""
              }`}
            >
              {q.options.map((opt) => {
                let extra = "";
                if (isSubmitted && expected !== "") {
                  if (opt.key === expected) {
                    // correct option
                    extra = user === expected ? "option-correct" : "option-correct-highlight";
                  } else if (opt.key === user && user !== expected) {
                    // user's wrong choice
                    extra = "option-wrong";
                  }
                }

                return (
                  <label
                    key={opt.key}
                    className={`ls-option ${answers[q.q] === opt.key ? "selected" : ""} ${extra}`}
                  >
                    <input
                      type="radio"
                      name={`q-${q.q}`}
                      value={opt.key}
                      checked={answers[q.q] === opt.key}
                      onChange={() => onChange(q.q, opt.key)}
                    />

                    <div className="option-content">
                      <div className="option-label">{opt.key}</div>

                      {opt.type === "image" ? (
                        <img src={opt.src.url} alt={opt.key} />
                      ) : (
                        <span>{opt.text}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MatchingBlock = ({ block, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  const [openQ, setOpenQ] = useState(null);
  const wrapperRef = useRef();

  // CLICK OUTSIDE → CLOSE POPUP
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpenQ(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // FILTER OPTIONS
  const getAvailableOptions = (currentQ) => {
    // If duplicate allowed, all options remain available for every question in this block
    if (block.duplicate) return block.options;

    // Otherwise, only consider answers given to questions that belong to THIS block.
    const questionIds = (block.questions || []).map((qq) => Number(qq.q));

    const usedValues = questionIds
      .filter((qid) => qid !== Number(currentQ))
      .map((qid) => answers[qid])
      .filter((v) => v !== undefined && v !== null && v !== "");

    return block.options.filter((opt) => !usedValues.includes(opt.key));
  };

    return (
    <div className="ls-matching" ref={wrapperRef}>
      {/* OPTIONS */}
      <div className="ls-match-options">
        {block.options.map((opt) => (
          <div key={opt.key}>
            <strong>{opt.key}</strong> – {opt.text}
          </div>
        ))}
      </div>

      {/* QUESTIONS */}
      <div className="ls-match-questions">
        {block.questions.map((q) => {
          const selected = answers[q.q];
          const availableOptions = getAvailableOptions(q.q);

          const expected = (answerKeyMap && answerKeyMap[q.q]) || "";
          const user = answers[q.q] || "";
          const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
          const isCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

          const isDisabled =
            !block.duplicate && availableOptions.length === 0 && !selected;

          return (
                <div
                  key={q.q}
                  className="ls-match-item"
                  id={`q-${q.q}`}
                >
              <span style={{display:'flex', alignItems:'center', gap:8}}>
                <span>{q.q}. {q.label}</span>
                {isSubmitted && onOpenScriptForQuestion && (
                  <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(q.q)} title="Xem script">
                    <ScrollText size={16} />
                  </button>
                )}
              </span>

              <div className="ls-select-wrapper">
                {/* SELECT BOX */}
                <div
                  className={`ls-select ${isDisabled ? "disabled" : ""} ${isSubmitted && expected !== "" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}
                  onClick={() => {
                    if (isDisabled) return;
                    setOpenQ(openQ === q.q ? null : q.q);
                  }}
                >
                  {selected || "--"}
                  {isSubmitted && expected !== "" && !isCorrect && (
                    <span className="correct-answer">{expected}</span>
                  )}
                </div>

                {/* POPUP */}
                {openQ === q.q && !isDisabled && (
                  <div className="ls-dropdown">
                    <div
                        className="ls-option-item"
                        onClick={() => {
                          onChange(q.q, "");
                          setOpenQ(null);
                        }}
                      >
                        --
                      </div>
                    {availableOptions.map((opt) => (
                      <div
                        key={opt.key}
                        className={`ls-option-item ${isSubmitted && expected !== "" && opt.key === expected && user !== expected ? "correct-item" : ""}`}
                        onClick={() => {
                          onChange(q.q, opt.key);
                          setOpenQ(null);
                        }}
                      >
                        {opt.key} – {opt.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DiagramLabelBlock = ({ block, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  return (
    <div className="ls-diagram-label">
      {block.questions.map((q) => {
        const expected = (answerKeyMap && answerKeyMap[q.q]) || "";
        const user = answers[q.q] || "";
        const normalize = (s = "") => (s || "").toString().trim().toLowerCase();
        const isCorrect = isSubmitted && expected !== "" && normalize(user) === normalize(expected);

        return (
          <div key={q.q} className="ls-diagram-item" id={`q-${q.q}`}>
            <span>{q.q}</span>
            <input
              className={`ls-input ${isSubmitted && expected !== "" ? (isCorrect ? "input-correct" : "input-wrong") : ""}`}
              value={answers[q.q] || ""}
              onChange={(e) => onChange(q.q, e.target.value)}
            />
            {isSubmitted && expected !== "" && !isCorrect && (
              <span className="correct-answer">{expected}</span>
            )}
            {isSubmitted && onOpenScriptForQuestion && (
              <button className="ls-script-btn" onClick={() => onOpenScriptForQuestion(q.q)} title="Xem script">
                <ScrollText size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ImageBlock = ({ src, alt }) => {
  return (
    <div className="ls-image">
      <img src={src.url} alt={alt} />
    </div>
  );
};

const ListeningRenderer = ({ blocks, answers, onChange, answerKeyMap = {}, isSubmitted = false, onOpenScriptForQuestion }) => {
  return (
    <div>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "instruction":
            return <Instruction key={index} {...block} />;

          case "note":
            return (
              <NoteBlock
                key={index}
                block={block}
                answers={answers}
                onChange={onChange}
                answerKeyMap={answerKeyMap}
                isSubmitted={isSubmitted}
                onOpenScriptForQuestion={onOpenScriptForQuestion}
              />
            );

          case "table":
            return (
              <TableBlock
                key={index}
                block={block}
                answers={answers}
                onChange={onChange}
                answerKeyMap={answerKeyMap}
                isSubmitted={isSubmitted}
                onOpenScriptForQuestion={onOpenScriptForQuestion}
              />
            );

          case "mcq":
                return (
                <MCQBlock
                    key={index}
                    block={block}
                    answers={answers}
                    onChange={onChange}
                    answerKeyMap={answerKeyMap}
                  isSubmitted={isSubmitted}
                  onOpenScriptForQuestion={onOpenScriptForQuestion}
                />
                );

            case "matching":
                return (
                <MatchingBlock
                    key={index}
                    block={block}
                    answers={answers}
                    onChange={onChange}
                    answerKeyMap={answerKeyMap}
                  isSubmitted={isSubmitted}
                  onOpenScriptForQuestion={onOpenScriptForQuestion}
                />
                );

            case "diagram-label":
                return (
                    <DiagramLabelBlock
                    key={index}
                    block={block}
                    answers={answers}
                    onChange={onChange}
                    answerKeyMap={answerKeyMap}
                isSubmitted={isSubmitted}
                onOpenScriptForQuestion={onOpenScriptForQuestion}
                    />
                );

            case "image":
                return <ImageBlock key={index} {...block} />;

            default:
                return null;
        }
      })}
    </div>
  );
};

export default ListeningRenderer;