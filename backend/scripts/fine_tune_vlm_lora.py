from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments, Trainer
from peft import get_peft_model, LoraConfig, TaskType
import json
from pathlib import Path

# Load triplet dataset (image, instruction, output)
def load_triplet_dataset(path):
    with open(path, 'r') as f:
        return json.load(f)

if __name__ == "__main__":
    dataset = load_triplet_dataset("data/vlm_triplets.json")
    model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2-VL-7B-Instruct", device_map="auto")
    tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2-VL-7B-Instruct")

    lora_config = LoraConfig(
        r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05, bias="none", task_type=TaskType.CAUSAL_LM
    )

    model = get_peft_model(model, lora_config)

    training_args = TrainingArguments(
        output_dir="models/vlm_adapters/latest",
        per_device_train_batch_size=1,
        learning_rate=5e-5,
        num_train_epochs=3,
        save_strategy="epoch"
    )

    # Build dummy dataset class
    class SimpleDataset:
        def __init__(self, data):
            self.data = data
        def __len__(self):
            return len(self.data)
        def __getitem__(self, idx):
            item = self.data[idx]
            input_text = f"Instruction: {item['instruction']}\nAnswer:"
            inputs = tokenizer(input_text, return_tensors="pt")
            labels = tokenizer(item["output"], return_tensors="pt")["input_ids"]
            inputs["labels"] = labels
            return inputs

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=SimpleDataset(dataset)
    )

    trainer.train()
    model.save_pretrained("models/vlm_adapters/latest")
    print("LoRA adapter fine-tuned and saved.")
